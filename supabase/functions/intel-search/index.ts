import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supa.ts";
import { embed, chat, MODELS, tryParseJson } from "../_shared/ai.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "search";
    const supa = serviceClient();

    if (action === "search") {
      const q = url.searchParams.get("q") ?? "";
      if (!q) return jsonResponse({ error: "q required" }, 400);
      const emb = await embed(q);
      const { data, error } = await supa.rpc("match_claims", {
        query_embedding: emb as unknown as string,
        match_threshold: 0.5,
        match_count: 20,
      });
      if (error) throw error;
      return jsonResponse({ query: q, results: data ?? [] });
    }

    if (action === "entities") {
      const { text } = await req.json();
      const r = await chat(
        [
          {
            role: "system",
            content:
              "Extract entities. Output JSON: {entities:[{name,type:(person|org|country|event),salience:0-1}]}",
          },
          { role: "user", content: text },
        ],
        { model: MODELS.cheap, responseFormat: "json" },
      );
      return jsonResponse(tryParseJson(r.content) ?? { entities: [] });
    }

    if (action === "trending") {
      const { data } = await supa
        .from("topic_memory")
        .select("topic, summary, story_count, last_updated")
        .order("last_updated", { ascending: false })
        .limit(20);
      return jsonResponse({ topics: data ?? [] });
    }

    if (action === "breaking") {
      const { data } = await supa
        .from("verification_runs")
        .select("run_id, topic, story_headline, consensus_score, published_at")
        .eq("published", true)
        .gte("published_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order("published_at", { ascending: false })
        .limit(10);
      return jsonResponse({ stories: data ?? [] });
    }

    if (action === "entity") {
      const name = url.searchParams.get("name") ?? "";
      if (!name) return jsonResponse({ error: "name required" }, 400);
      const { data: ent } = await supa
        .from("entities")
        .select("*")
        .ilike("name", name)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ent) return jsonResponse({ entity: null });
      const { data: edges } = await supa
        .from("entity_edges")
        .select("relation, dst_entity, weight, last_seen")
        .eq("src_entity", ent.id)
        .order("weight", { ascending: false })
        .limit(15);
      const dstIds = (edges ?? []).map((e: { dst_entity: string }) => e.dst_entity);
      const { data: neighbors } = dstIds.length
        ? await supa.from("entities").select("id,name,type").in("id", dstIds)
        : { data: [] };
      const { data: mentions } = await supa
        .from("entity_mentions")
        .select("claim_id, confidence, claims(claim_text, status, confidence, topic)")
        .eq("entity_id", ent.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return jsonResponse({ entity: ent, edges: edges ?? [], neighbors: neighbors ?? [], mentions: mentions ?? [] });
    }

    if (action === "events") {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 30);
      const { data } = await supa
        .from("event_clusters")
        .select("id, label, summary, hotness, entity_ids, claim_ids, last_updated, started_at")
        .order("hotness", { ascending: false })
        .order("last_updated", { ascending: false })
        .limit(limit);
      return jsonResponse({ events: data ?? [] });
    }

    if (action === "graph") {
      const entityParam = url.searchParams.get("entity") ?? "";
      if (!entityParam) return jsonResponse({ error: "entity required" }, 400);
      const { data: ent } = await supa
        .from("entities")
        .select("id, name, type")
        .ilike("name", entityParam)
        .limit(1)
        .maybeSingle();
      if (!ent) return jsonResponse({ nodes: [], edges: [] });
      const { data: outE } = await supa
        .from("entity_edges")
        .select("src_entity, dst_entity, relation, weight")
        .eq("src_entity", ent.id);
      const { data: inE } = await supa
        .from("entity_edges")
        .select("src_entity, dst_entity, relation, weight")
        .eq("dst_entity", ent.id);
      const allEdges = [...(outE ?? []), ...(inE ?? [])];
      const ids = new Set<string>([ent.id]);
      for (const e of allEdges) { ids.add(e.src_entity); ids.add(e.dst_entity); }
      const { data: nodes } = await supa
        .from("entities")
        .select("id, name, type, salience")
        .in("id", Array.from(ids));
      return jsonResponse({ nodes: nodes ?? [], edges: allEdges });
    }

    return jsonResponse({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("intel-search error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
