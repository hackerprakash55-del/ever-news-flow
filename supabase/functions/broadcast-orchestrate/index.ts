import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supa.ts";
import { chat, MODELS, tryParseJson } from "../_shared/ai.ts";

// Runs every ~2 minutes via pg_cron. Picks the hottest unbroadcast event
// cluster, generates intro+story+outro segments, appends them to the
// currently-live broadcast (or starts a new one), and advances the
// `current_segment_id` pointer.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supa = serviceClient();

    // 1. Pick the live broadcast (or start one).
    let { data: broadcast } = await supa
      .from("live_broadcasts")
      .select("*")
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!broadcast) {
      const { data: created } = await supa
        .from("live_broadcasts")
        .insert({ status: "live", headline: "GAINN Live Broadcast" })
        .select("*")
        .single();
      broadcast = created;
    }
    if (!broadcast) return jsonResponse({ error: "could not start broadcast" }, 500);

    // 2. Pick the hottest event cluster that hasn't been broadcast in 30 min.
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: clusters } = await supa
      .from("event_clusters")
      .select("id, label, summary, hotness, broadcasted_at, claim_ids")
      .or(`broadcasted_at.is.null,broadcasted_at.lt.${cutoff}`)
      .gt("hotness", 0)
      .order("hotness", { ascending: false })
      .order("last_updated", { ascending: false })
      .limit(1);
    const cluster = clusters?.[0];
    if (!cluster) {
      return jsonResponse({ ok: true, broadcast_id: broadcast.id, skipped: "no hot cluster" });
    }

    // 3. Pull a couple of claims for the story segment.
    let claimSnippets: string[] = [];
    if (cluster.claim_ids?.length) {
      const { data: cs } = await supa
        .from("claims")
        .select("claim_text, confidence")
        .in("id", cluster.claim_ids)
        .order("confidence", { ascending: false })
        .limit(4);
      claimSnippets = (cs ?? []).map((c) => c.claim_text);
    }

    // 4. Generate 3 segments via the AI gateway.
    const res = await chat(
      [
        {
          role: "system",
          content:
            "You are GAINN's live broadcast scriptwriter. Output JSON only: {intro:{script,duration_s}, story:{script,duration_s}, outro:{script,duration_s}}. Intro 15-25s. Story 60-120s using ONLY the supplied verified claims. Outro 10-15s. Neutral, factual, third-person. No invented quotes.",
        },
        {
          role: "user",
          content: `Event: ${cluster.label}\nSummary: ${cluster.summary ?? ""}\nVerified claims:\n${claimSnippets.map((c, i) => `${i + 1}. ${c}`).join("\n") || "(none — write only background context)"}`,
        },
      ],
      { model: MODELS.fast, responseFormat: "json" },
    );
    const parsed = tryParseJson<{
      intro?: { script: string; duration_s?: number };
      story?: { script: string; duration_s?: number };
      outro?: { script: string; duration_s?: number };
    }>(res.content) ?? {};

    const segments = [
      { kind: "intro", ...(parsed.intro ?? { script: `Welcome back to GAINN Live. Up next: ${cluster.label}.`, duration_s: 20 }) },
      { kind: "story", ...(parsed.story ?? { script: cluster.summary ?? cluster.label, duration_s: 90 }) },
      { kind: "outro", ...(parsed.outro ?? { script: "Stay with GAINN for continuous AI-verified coverage.", duration_s: 12 }) },
    ];

    // 5. Find current max segment_order so we append correctly.
    const { data: lastSeg } = await supa
      .from("broadcast_segments")
      .select("segment_order")
      .eq("broadcast_id", broadcast.id)
      .order("segment_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let order = (lastSeg?.segment_order ?? 0) + 1;

    const rows = segments.map((s) => ({
      broadcast_id: broadcast!.id,
      segment_order: order++,
      kind: s.kind as "intro" | "story" | "outro",
      script: String(s.script ?? "").slice(0, 4000),
      duration_s: Math.max(5, Math.min(180, Number(s.duration_s ?? 30))),
      voice: "anchor",
      event_cluster_id: cluster.id,
    }));
    const { data: inserted } = await supa
      .from("broadcast_segments")
      .insert(rows)
      .select("id, segment_order");
    const firstNewId = inserted?.[0]?.id;

    // 6. Advance broadcast pointer + headline; mark cluster as broadcast.
    await supa
      .from("live_broadcasts")
      .update({
        current_segment_id: firstNewId ?? broadcast.current_segment_id,
        headline: cluster.label,
      })
      .eq("id", broadcast.id);
    await supa
      .from("event_clusters")
      .update({ broadcasted_at: new Date().toISOString() })
      .eq("id", cluster.id);

    return jsonResponse({
      ok: true,
      broadcast_id: broadcast.id,
      cluster_id: cluster.id,
      segments_inserted: rows.length,
    });
  } catch (e) {
    console.error("broadcast-orchestrate error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});