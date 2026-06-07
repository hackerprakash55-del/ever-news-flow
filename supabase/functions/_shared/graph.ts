// Knowledge-graph + event-clustering utilities.
// Called after the consensus engine publishes a verified story.
import { serviceClient } from "./supa.ts";
import { chat, embed, MODELS, tryParseJson } from "./ai.ts";
import { recordTrace } from "./memory.ts";

export interface ExtractedEntity {
  name: string;
  type: "person" | "org" | "country" | "event" | "topic" | "other";
  salience?: number;
}

export interface ExtractedRelation {
  subject: string;
  predicate: string;
  object: string;
}

export interface GraphExtraction {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
}

function normType(t: string): ExtractedEntity["type"] {
  const k = t.toLowerCase();
  if (["person", "people", "individual"].includes(k)) return "person";
  if (["org", "organization", "company", "agency"].includes(k)) return "org";
  if (["country", "nation", "state"].includes(k)) return "country";
  if (["event"].includes(k)) return "event";
  if (["topic", "theme"].includes(k)) return "topic";
  return "other";
}

export async function extractGraph(text: string): Promise<GraphExtraction> {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "Extract entities and relations from a news claim. Output JSON: {entities:[{name,type:(person|org|country|event|topic|other),salience:0-1}], relations:[{subject,predicate,object}]}. Up to 6 entities, 4 relations. Skip generic nouns.",
      },
      { role: "user", content: text.slice(0, 2000) },
    ],
    { model: MODELS.cheap, responseFormat: "json" },
  );
  const parsed = tryParseJson<GraphExtraction>(res.content) ?? { entities: [], relations: [] };
  return {
    entities: (parsed.entities ?? []).slice(0, 6).map((e) => ({
      name: String(e.name ?? "").trim(),
      type: normType(String(e.type ?? "other")),
      salience: Number(e.salience ?? 0.5),
    })).filter((e) => e.name.length > 1),
    relations: (parsed.relations ?? []).slice(0, 4).map((r) => ({
      subject: String(r.subject ?? "").trim(),
      predicate: String(r.predicate ?? "").trim().slice(0, 80),
      object: String(r.object ?? "").trim(),
    })).filter((r) => r.subject && r.predicate && r.object),
  };
}

/** Upsert an entity, dedupe by exact (lower(name),type) and semantic match. */
export async function upsertEntity(e: ExtractedEntity): Promise<string | null> {
  if (!e.name) return null;
  const supa = serviceClient();
  // 1. exact match
  const { data: exact } = await supa
    .from("entities")
    .select("id")
    .ilike("name", e.name)
    .eq("type", e.type)
    .maybeSingle();
  if (exact?.id) {
    await supa
      .from("entities")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", exact.id);
    return exact.id as string;
  }
  // 2. semantic match (0.82)
  const emb = await embed(`${e.type}: ${e.name}`);
  try {
    const { data: sim } = await supa.rpc("match_entities", {
      query_embedding: emb as unknown as string,
      match_threshold: 0.82,
      match_count: 1,
    });
    if (sim && sim.length && (sim[0] as { type?: string }).type === e.type) {
      const id = (sim[0] as { id: string }).id;
      await supa
        .from("entities")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", id);
      return id;
    }
  } catch (_) { /* ignore */ }
  // 3. insert
  const { data: ins, error } = await supa
    .from("entities")
    .insert({
      name: e.name,
      type: e.type,
      salience: e.salience ?? 0.5,
      embedding: emb as unknown as string,
    })
    .select("id")
    .single();
  if (error) {
    // race condition fallback: re-fetch exact match
    const { data: again } = await supa
      .from("entities")
      .select("id")
      .ilike("name", e.name)
      .eq("type", e.type)
      .maybeSingle();
    return again?.id ?? null;
  }
  return ins?.id ?? null;
}

export async function recordMention(entityId: string, claimId: string, confidence = 0.7) {
  const supa = serviceClient();
  await supa
    .from("entity_mentions")
    .upsert({ entity_id: entityId, claim_id: claimId, confidence }, { onConflict: "entity_id,claim_id" });
  await supa.rpc; // noop placeholder
  // bump entity mention count + salience
  await supa.from("entities")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", entityId);
}

export async function recordEdge(
  srcId: string,
  dstId: string,
  relation: string,
  claimId: string,
) {
  const supa = serviceClient();
  const { data: existing } = await supa
    .from("entity_edges")
    .select("id, weight, evidence_claim_ids")
    .eq("src_entity", srcId)
    .eq("dst_entity", dstId)
    .eq("relation", relation)
    .maybeSingle();
  if (existing) {
    const ev = Array.from(new Set([...(existing.evidence_claim_ids ?? []), claimId]));
    await supa
      .from("entity_edges")
      .update({
        weight: Number(existing.weight ?? 1) + 1,
        evidence_claim_ids: ev,
        last_seen: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supa.from("entity_edges").insert({
      src_entity: srcId,
      dst_entity: dstId,
      relation,
      weight: 1,
      evidence_claim_ids: [claimId],
    });
  }
}

/** Assign a claim to an event cluster (semantic match ≥ 0.75, else new). */
export async function assignEventCluster(
  label: string,
  summary: string,
  claimId: string,
  entityIds: string[],
): Promise<string | null> {
  const supa = serviceClient();
  const emb = await embed(`${label}\n${summary}`);
  try {
    const { data: sim } = await supa.rpc("match_events", {
      query_embedding: emb as unknown as string,
      match_threshold: 0.75,
      match_count: 1,
    });
    if (sim && sim.length) {
      const id = (sim[0] as { id: string }).id;
      const { data: cur } = await supa
        .from("event_clusters")
        .select("claim_ids, entity_ids, hotness")
        .eq("id", id)
        .maybeSingle();
      const claim_ids = Array.from(new Set([...(cur?.claim_ids ?? []), claimId]));
      const entity_ids = Array.from(new Set([...(cur?.entity_ids ?? []), ...entityIds]));
      // EMA hotness bump
      const newHot = (Number(cur?.hotness ?? 0) * 0.9) + 1.0;
      await supa
        .from("event_clusters")
        .update({
          claim_ids,
          entity_ids,
          hotness: newHot,
          last_updated: new Date().toISOString(),
        })
        .eq("id", id);
      return id;
    }
  } catch (_) { /* ignore */ }
  const { data: ins } = await supa
    .from("event_clusters")
    .insert({
      label: label.slice(0, 200),
      summary: summary.slice(0, 2000),
      claim_ids: [claimId],
      entity_ids: entityIds,
      hotness: 1.0,
      embedding: emb as unknown as string,
    })
    .select("id")
    .single();
  return ins?.id ?? null;
}

/** Top-level: process a verified claim through the full graph pipeline. */
export async function graphAgent(
  ctx: { runId: string; step: number },
  claimId: string,
  claimText: string,
  topic: string,
) {
  const start = Date.now();
  let entitiesCreated = 0;
  let edgesCreated = 0;
  let eventClusterId: string | null = null;
  try {
    const ex = await extractGraph(claimText);
    const nameToId = new Map<string, string>();
    for (const e of ex.entities) {
      const id = await upsertEntity(e);
      if (id) {
        nameToId.set(e.name.toLowerCase(), id);
        await recordMention(id, claimId, e.salience ?? 0.6);
        entitiesCreated++;
      }
    }
    for (const r of ex.relations) {
      const src = nameToId.get(r.subject.toLowerCase());
      const dst = nameToId.get(r.object.toLowerCase());
      if (src && dst && src !== dst) {
        await recordEdge(src, dst, r.predicate, claimId);
        edgesCreated++;
      }
    }
    eventClusterId = await assignEventCluster(
      topic || claimText.slice(0, 80),
      claimText,
      claimId,
      Array.from(nameToId.values()),
    );
    await recordTrace({
      runId: ctx.runId,
      agent: "graph",
      step: ctx.step,
      input: { claimId, topic },
      output: { entitiesCreated, edgesCreated, eventClusterId },
      latencyMs: Date.now() - start,
    });
  } catch (e) {
    await recordTrace({
      runId: ctx.runId,
      agent: "graph",
      step: ctx.step,
      input: { claimId },
      latencyMs: Date.now() - start,
      status: "error",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
  return { entitiesCreated, edgesCreated, eventClusterId };
}