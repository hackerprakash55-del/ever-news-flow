// Called on a schedule by the GitHub Actions renderer.
// action "next": picks (or creates) the next queued Short and returns its script + narration audio.
// action "fail": records a render failure.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAdmin } from "../_shared/supa.ts";
import { isRenderer, serviceClient } from "../_shared/youtube.ts";

const DAILY_CAP = parseInt(Deno.env.get("DAILY_AUTO_PUBLISH_CAP") || "5");
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function narrate(text: string, language: string): Promise<string | null> {
  const key = Deno.env.get("SARVAM_API_KEY");
  if (!key) return null;
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 1400), target_language_code: language, speaker: "shubh", model: "bulbul:v3" }),
  });
  if (!res.ok) { console.error("Sarvam", res.status, await res.text()); return null; }
  const d = await res.json();
  return d?.audios?.[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!isRenderer(req)) {
      const a = await requireAdmin(req.headers.get("Authorization") ?? "");
      if (!a.ok) return json({ error: a.error }, a.status);
    }
    const db = serviceClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "next";

    if (action === "fail") {
      if (typeof body.id !== "string") return json({ error: "id required" }, 400);
      const { data: row } = await db.from("youtube_publish_queue").select("attempts").eq("id", body.id).maybeSingle();
      const attempts = (row?.attempts ?? 0) + 1;
      await db.from("youtube_publish_queue").update({
        status: attempts >= 3 ? "failed" : "queued", attempts,
        error_message: String(body.error ?? "Render failed").slice(0, 1000), updated_at: new Date().toISOString(),
      }).eq("id", body.id);
      return json({ ok: true });
    }

    const { data: kill } = await db.from("app_settings").select("value").eq("key", "auto_publish_enabled").maybeSingle();
    if (kill && kill.value === false) return json({ item: null, reason: "Auto-publishing is switched off" });

    const { data: creds } = await db.from("youtube_credentials").select("id").eq("id", "default").maybeSingle();
    if (!creds) return json({ item: null, reason: "YouTube channel not connected" });

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from("youtube_publish_queue").select("id", { count: "exact", head: true })
      .eq("status", "uploaded").gte("uploaded_at", since);
    if ((count ?? 0) >= DAILY_CAP) return json({ item: null, reason: `Daily limit of ${DAILY_CAP} reached` });

    let { data: item } = await db.from("youtube_publish_queue").select("*")
      .eq("status", "queued").order("created_at").limit(1).maybeSingle();

    if (!item) {
      // Pick the freshest real story from the shared news cache that hasn't been queued yet.
      const { data: caches } = await db.from("news_feed_cache").select("articles, language")
        .order("fetched_at", { ascending: false }).limit(5);
      const { data: done } = await db.from("youtube_publish_queue").select("article_id")
        .gte("created_at", new Date(Date.now() - 7 * 86400 * 1000).toISOString());
      const used = new Set((done ?? []).map((d) => d.article_id));
      let pick: any = null, lang = "en-IN";
      for (const c of caches ?? []) {
        for (const a of (c.articles as any[]) ?? []) {
          if (a?.id && a?.headline && a?.url && !used.has(String(a.id))) { pick = a; lang = c.language === "hi" ? "hi-IN" : "en-IN"; break; }
        }
        if (pick) break;
      }
      if (!pick) return json({ item: null, reason: "No new stories to publish" });
      const source = pick.verification?.sources_checked?.[0]?.outlet ?? pick.sources?.[0] ?? null;
      const summary = String(pick.summary ?? "").replace(/\s+/g, " ").trim();
      const script = `${pick.headline}. ${summary}`.slice(0, 900);
      const ins = await db.from("youtube_publish_queue").insert({
        article_id: String(pick.id), title: String(pick.headline).slice(0, 200), script,
        source_name: typeof source === "string" ? source : source?.name ?? null, source_url: pick.url, language: lang,
      }).select("*").single();
      if (ins.error) throw ins.error;
      item = ins.data;
    }

    await db.from("youtube_publish_queue").update({ status: "rendering", updated_at: new Date().toISOString() }).eq("id", item.id);
    const intro = item.language === "hi-IN" ? "गेन रिपोर्ट। " : "GAINN report. ";
    const audio = await narrate(intro + item.script, item.language);
    return json({ item, audioBase64: audio });
  } catch (e) {
    console.error("youtube-publisher error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
