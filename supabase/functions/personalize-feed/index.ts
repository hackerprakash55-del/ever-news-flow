import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userClient } from "../_shared/supa.ts";
import { embed } from "../_shared/ai.ts";

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const EWMA_ALPHA = 0.1;
function ewma(prev: number[] | null, next: number[]): number[] {
  if (!prev || prev.length !== next.length) return next.slice();
  const out = new Array(next.length);
  for (let i = 0; i < next.length; i++) out[i] = prev[i] * (1 - EWMA_ALPHA) + next[i] * EWMA_ALPHA;
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
  const usrSupa = userClient(auth);
  const token = auth.replace("Bearer ", "");
  const { data: claimsAuth, error: authErr } = await usrSupa.auth.getClaims(token);
  if (authErr || !claimsAuth?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
  const userId = claimsAuth.claims.sub as string;

  try {
    const supa = serviceClient();
    const { lambda = 0.7, limit = 20 } = await req.json().catch(() => ({}));

    // 1. Load (or initialize) the user's interest vector.
    const { data: prefs } = await supa
      .from("news_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    let interest: number[] | null = (prefs?.interest_embedding as unknown as number[]) ?? null;

    // 2. Update interest vector incrementally from recent positive events.
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data: events } = await supa
      .from("user_events")
      .select("event_type, article_id, category, dwell_ms, ts")
      .eq("user_id", userId)
      .gte("ts", since)
      .in("event_type", ["read", "bookmark", "share", "dwell"])
      .order("ts", { ascending: false })
      .limit(50);
    if (events?.length) {
      const blob = events
        .map((e) => `${e.event_type}:${e.category ?? ""}:${e.article_id}`)
        .join("\n");
      try {
        const vec = await embed(blob);
        interest = ewma(interest, vec);
        await supa
          .from("news_preferences")
          .upsert(
            { user_id: userId, interest_embedding: interest as unknown as string, last_signal_at: new Date().toISOString() },
            { onConflict: "user_id" },
          );
      } catch (e) { console.warn("interest update failed:", (e as Error).message); }
    }

    // 3. Candidate set — recent published runs + hot clusters.
    const sinceCand = new Date(Date.now() - 48 * 3600_000).toISOString();
    const [{ data: runs }, { data: clusters }] = await Promise.all([
      supa.from("verification_runs")
        .select("run_id, topic, story_headline, consensus_score, published_at, claim_ids")
        .eq("published", true)
        .gte("published_at", sinceCand)
        .order("published_at", { ascending: false })
        .limit(120),
      supa.from("event_clusters")
        .select("id, label, summary, hotness, last_updated, entity_ids")
        .order("hotness", { ascending: false })
        .limit(60),
    ]);

    interface Candidate {
      kind: "run" | "cluster";
      id: string;
      label: string;
      summary: string;
      score_base: number;
      embedding?: number[];
      categoryKey: string;
    }
    const candidates: Candidate[] = [];
    for (const r of runs ?? []) {
      candidates.push({
        kind: "run",
        id: r.run_id,
        label: r.story_headline ?? r.topic ?? "Untitled",
        summary: r.topic ?? "",
        score_base: Number(r.consensus_score ?? 0),
        categoryKey: r.topic ?? "general",
      });
    }
    for (const c of clusters ?? []) {
      candidates.push({
        kind: "cluster",
        id: c.id,
        label: c.label,
        summary: c.summary ?? "",
        score_base: Math.min(1, Number(c.hotness ?? 0) / 10),
        categoryKey: c.label,
      });
    }

    // Embed candidates (parallel, capped). If we have no interest vector we
    // skip embedding entirely and rank by base score + recency.
    if (interest && candidates.length) {
      const items = candidates.slice(0, 80);
      const embs = await Promise.all(items.map(async (it) => {
        try { return await embed(`${it.label}\n${it.summary}`); } catch { return null; }
      }));
      items.forEach((it, i) => { if (embs[i]) it.embedding = embs[i] as number[]; });
    }

    // 4. MMR re-rank.
    const selected: Array<Candidate & { mmr: number; reason: string }> = [];
    const remaining = [...candidates];
    while (remaining.length && selected.length < limit) {
      let bestIdx = -1, bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i];
        const rel = interest && c.embedding
          ? cosine(interest, c.embedding) * 0.5 + c.score_base * 0.5
          : c.score_base;
        let div = 0;
        for (const s of selected) {
          if (s.embedding && c.embedding) div = Math.max(div, cosine(s.embedding, c.embedding));
          if (s.categoryKey === c.categoryKey) div = Math.max(div, 0.6);
        }
        const mmr = lambda * rel - (1 - lambda) * div;
        if (mmr > bestScore) { bestScore = mmr; bestIdx = i; }
      }
      if (bestIdx < 0) break;
      const [picked] = remaining.splice(bestIdx, 1);
      selected.push({
        ...picked,
        mmr: bestScore,
        reason: interest && picked.embedding
          ? "matches your interests"
          : "trending and verified",
      });
    }

    return jsonResponse({
      user_id: userId,
      lambda,
      count: selected.length,
      items: selected.map((s) => ({
        kind: s.kind,
        id: s.id,
        label: s.label,
        summary: s.summary,
        score: s.mmr,
        reason: s.reason,
      })),
    });
  } catch (e) {
    console.error("personalize-feed error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});