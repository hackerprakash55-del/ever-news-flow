import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  discoveryAgent,
  verificationAgent,
  contradictionAgent,
  reasoningAgent,
  editorialAgent,
  distributionAgent,
} from "../_shared/agents.ts";
import {
  upsertClaim,
  recordEvidence,
  findCachedTopic,
  upsertTopicMemory,
} from "../_shared/memory.ts";
import { aggregateConsensus } from "../_shared/trust.ts";
import { serviceClient } from "../_shared/supa.ts";
import { graphAgent } from "../_shared/graph.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const { topic, threshold = 0.7, force = false } = await req.json();
    if (!topic) return jsonResponse({ error: "topic required" }, 400);

    const runId = crypto.randomUUID();

    // 0. Cache check
    if (!force) {
      const cached = await findCachedTopic(topic);
      if (cached?.summary) {
        return jsonResponse({
          runId,
          cached: true,
          topic,
          summary: cached.summary,
          entities: cached.entities,
        });
      }
    }

    let step = 0;
    // 1. Discovery
    const headlines = await discoveryAgent({ runId, step: step++ }, topic);
    if (!headlines.length) {
      return jsonResponse({ runId, error: "no headlines found", topic }, 200);
    }

    // 2. Verification — extract claims
    const claimDrafts = await verificationAgent({ runId, step: step++ }, topic, headlines);

    // 3. Persist claims + evidence
    const claimIds: string[] = [];
    for (const c of claimDrafts) {
      try {
        const { id } = await upsertClaim({
          claimText: c.text,
          topic,
          entities: c.entities ?? [],
          confidence: c.confidence ?? 0.5,
        });
        claimIds.push(id);
        // attach top 3 headlines as supporting evidence
        for (const h of headlines.slice(0, 3)) {
          await recordEvidence(id, h.url, "supports", h.description);
        }
      } catch (e) {
        console.error("upsertClaim err:", e);
      }
    }

    // 4. Contradiction
    const contradictions = await contradictionAgent(
      { runId, step: step++ },
      claimDrafts,
    );

    // 5. Consensus — 3 parallel reasoning passes
    const variants = await Promise.all([
      reasoningAgent({ runId, step: step++ }, topic, claimDrafts, contradictions, 0),
      reasoningAgent({ runId, step: step++ }, topic, claimDrafts, contradictions, 1),
      reasoningAgent({ runId, step: step++ }, topic, claimDrafts, contradictions, 2),
    ]);
    const consensusScore = aggregateConsensus(variants.map((v) => v.confidence));
    const thresholdMet = consensusScore >= threshold;

    let article: Record<string, unknown> | null = null;
    let distribution: Record<string, unknown> | null = null;

    // Best summary = highest confidence variant
    const best = [...variants].sort((a, b) => b.confidence - a.confidence)[0];

    if (thresholdMet) {
      // 6. Editorial
      article = await editorialAgent(
        { runId, step: step++ },
        topic,
        best.summary,
        variants.map((v) => ({ summary: v.summary, confidence: v.confidence })),
      );
      // 7. Distribution
      distribution = await distributionAgent({ runId, step: step++ }, article);

      await upsertTopicMemory(topic, best.summary, claimDrafts.flatMap((c) => c.entities ?? []));

      // 8. Knowledge graph + event clustering for every persisted claim.
      //    Run sequentially to avoid hammering the embedding endpoint.
      for (let i = 0; i < claimIds.length; i++) {
        const id = claimIds[i];
        const text = claimDrafts[i]?.text ?? "";
        if (!id || !text) continue;
        await graphAgent({ runId, step: step++ }, id, text, topic);
      }
    }

    // 8. Record verification run
    const supa = serviceClient();
    await supa.from("verification_runs").insert({
      run_id: runId,
      topic,
      story_headline: (article?.headline as string) ?? null,
      consensus_score: consensusScore,
      threshold,
      threshold_met: thresholdMet,
      agent_votes: variants.map((v) => ({ confidence: v.confidence, summary: v.summary.slice(0, 200) })),
      claim_ids: claimIds,
      published: thresholdMet,
      published_at: thresholdMet ? new Date().toISOString() : null,
      total_latency_ms: Date.now() - t0,
      metadata: { headline_count: headlines.length, claim_count: claimDrafts.length },
    });

    return jsonResponse({
      runId,
      topic,
      consensusScore,
      thresholdMet,
      claimCount: claimDrafts.length,
      article,
      distribution,
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    console.error("newsroom-orchestrate error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
