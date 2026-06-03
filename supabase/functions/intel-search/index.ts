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

    return jsonResponse({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("intel-search error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
