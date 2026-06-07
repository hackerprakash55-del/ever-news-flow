import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supa.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireAdmin(req.headers.get("Authorization"));
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const supa = serviceClient();
    const since24 = new Date(Date.now() - 24 * 3600_000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

    const [runs24, traces24, sources, claims, decisions24, labels7d, events] = await Promise.all([
      supa.from("verification_runs").select("consensus_score, threshold_met, published, total_latency_ms, total_tokens").gte("created_at", since24),
      supa.from("agent_traces").select("agent_name, tokens_in, tokens_out, latency_ms, status").gte("created_at", since24),
      supa.from("sources").select("domain, reliability_score, total_claims, verified_claims").order("reliability_score", { ascending: false }).limit(50),
      supa.from("claims").select("status").gte("created_at", since7d),
      supa.from("pipeline_decisions").select("route, fallback_reason, latency_ms").gte("created_at", since24),
      supa.from("ground_truth_labels").select("label, claim_id, created_at").gte("created_at", since7d),
      supa.from("event_clusters").select("id, hotness, last_updated").order("hotness", { ascending: false }).limit(20),
    ]);

    const runRows = runs24.data ?? [];
    const traceRows = traces24.data ?? [];
    const claimRows = claims.data ?? [];

    const avgConsensus = runRows.length
      ? runRows.reduce((a, r) => a + Number(r.consensus_score ?? 0), 0) / runRows.length
      : 0;
    const publishRate = runRows.length
      ? runRows.filter((r) => r.published).length / runRows.length
      : 0;
    const totalTokens = traceRows.reduce((a, t) => a + (t.tokens_in ?? 0) + (t.tokens_out ?? 0), 0);
    const latencies = runRows.map((r) => r.total_latency_ms ?? 0).filter(Boolean).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const verifiedPct = claimRows.length
      ? claimRows.filter((c) => c.status === "verified").length / claimRows.length
      : 0;
    const errorRate = traceRows.length
      ? traceRows.filter((t) => t.status === "error").length / traceRows.length
      : 0;

    // Phase 2: pipeline routing
    const decRows = decisions24.data ?? [];
    const orchRuns = decRows.filter((d) => d.route === "orchestrator").length;
    const fallbackRuns = decRows.filter((d) => d.route === "fallback").length;
    const pipelineRouting = {
      total_24h: decRows.length,
      orchestrator: orchRuns,
      fallback: fallbackRuns,
      orchestrator_pct: decRows.length ? orchRuns / decRows.length : 0,
      common_fallback_reasons: Object.entries(
        decRows
          .filter((d) => d.route === "fallback" && d.fallback_reason)
          .reduce<Record<string, number>>((acc, d) => {
            const k = d.fallback_reason as string;
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
          }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };

    // Phase 5: ground-truth accuracy
    const labelRows = labels7d.data ?? [];
    const accuracy7d = labelRows.length
      ? labelRows.filter((l) => l.label === "true").length / labelRows.length
      : null;
    const since24d = new Date(Date.now() - 24 * 3600_000).getTime();
    const labels24 = labelRows.filter((l) => new Date(l.created_at).getTime() >= since24d);
    const accuracy24h = labels24.length
      ? labels24.filter((l) => l.label === "true").length / labels24.length
      : null;

    // Hot events overview
    const hotEvents = events.data ?? [];

    return jsonResponse({
      window: { since24, since7d },
      newsroom: {
        runs_24h: runRows.length,
        avg_consensus_score: avgConsensus,
        publish_rate: publishRate,
        latency_p50_ms: p50,
        latency_p95_ms: p95,
      },
      agents: {
        traces_24h: traceRows.length,
        total_tokens_24h: totalTokens,
        error_rate: errorRate,
      },
      claims: {
        new_7d: claimRows.length,
        verified_pct: verifiedPct,
      },
      pipeline_routing: pipelineRouting,
      ground_truth: {
        labels_7d: labelRows.length,
        accuracy_7d: accuracy7d,
        accuracy_24h: accuracy24h,
      },
      hot_events: hotEvents,
      top_sources: sources.data ?? [],
    });
  } catch (e) {
    console.error("admin-metrics error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
