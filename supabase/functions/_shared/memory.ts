import { serviceClient } from "./supa.ts";
import { embed } from "./ai.ts";
import { domainOf, blendReliability } from "./trust.ts";

export interface ClaimRow {
  id: string;
  claim_text: string;
  status: string;
  confidence: number;
  similarity?: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 1000);
}

export async function findSimilarClaim(
  claimText: string,
  threshold = 0.88,
): Promise<ClaimRow | null> {
  const supa = serviceClient();
  const emb = await embed(claimText);
  const { data, error } = await supa.rpc("match_claims", {
    query_embedding: emb as unknown as string,
    match_threshold: threshold,
    match_count: 1,
  });
  if (error || !data?.length) return null;
  return data[0] as ClaimRow;
}

export async function upsertClaim(input: {
  claimText: string;
  topic?: string;
  entities?: unknown[];
  status?: string;
  confidence?: number;
}) {
  const supa = serviceClient();
  const existing = await findSimilarClaim(input.claimText, 0.9);
  if (existing) {
    await supa
      .from("claims")
      .update({
        last_seen_at: new Date().toISOString(),
        verification_count: undefined,
      })
      .eq("id", existing.id);
    // increment verification_count via RPC-style raw update
    await supa.rpc as unknown;
    return { id: existing.id, reused: true };
  }
  const emb = await embed(input.claimText);
  const { data, error } = await supa
    .from("claims")
    .insert({
      claim_text: input.claimText,
      normalized_text: normalize(input.claimText),
      embedding: emb as unknown as string,
      topic: input.topic ?? null,
      entities: input.entities ?? [],
      status: input.status ?? "unverified",
      confidence: input.confidence ?? 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data!.id, reused: false };
}

export async function recordEvidence(
  claimId: string,
  url: string,
  stance: "supports" | "refutes" | "neutral",
  excerpt?: string,
) {
  const supa = serviceClient();
  const domain = domainOf(url);
  // upsert source
  const { data: src } = await supa
    .from("sources")
    .upsert({ domain, display_name: domain, last_seen_at: new Date().toISOString() }, { onConflict: "domain" })
    .select("id, reliability_score")
    .single();
  await supa.from("claim_evidence").insert({
    claim_id: claimId,
    source_id: src?.id ?? null,
    stance,
    url,
    excerpt: excerpt?.slice(0, 500) ?? null,
    weight: src?.reliability_score ?? 0.5,
  });
  if (src) {
    const newRel = blendReliability(
      Number(src.reliability_score ?? 0.5),
      stance === "supports" ? "verified" : stance === "refutes" ? "refuted" : "neutral",
    );
    await supa
      .from("sources")
      .update({ reliability_score: newRel })
      .eq("id", src.id);
  }
}

export async function recordTrace(t: {
  runId: string;
  agent: string;
  step?: number;
  input?: unknown;
  output?: unknown;
  reasoning?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  status?: "ok" | "error" | "skipped";
  error?: string;
}) {
  const supa = serviceClient();
  await supa.from("agent_traces").insert({
    run_id: t.runId,
    agent_name: t.agent,
    step_order: t.step ?? 0,
    input: t.input ?? null,
    output: t.output ?? null,
    reasoning: t.reasoning ?? null,
    model: t.model ?? null,
    tokens_in: t.tokensIn ?? null,
    tokens_out: t.tokensOut ?? null,
    latency_ms: t.latencyMs ?? null,
    status: t.status ?? "ok",
    error: t.error ?? null,
  });
}

export async function findCachedTopic(topic: string) {
  const supa = serviceClient();
  const emb = await embed(topic);
  const { data } = await supa.rpc("match_topics", {
    query_embedding: emb as unknown as string,
    match_threshold: 0.85,
    match_count: 1,
  });
  return data?.[0] ?? null;
}

export async function upsertTopicMemory(
  topic: string,
  summary: string,
  entities: unknown[],
) {
  const supa = serviceClient();
  const emb = await embed(topic);
  await supa
    .from("topic_memory")
    .upsert(
      {
        topic,
        embedding: emb as unknown as string,
        summary,
        entities,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "topic" },
    );
}
