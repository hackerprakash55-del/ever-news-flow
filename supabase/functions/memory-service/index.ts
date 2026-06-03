import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  findSimilarClaim,
  upsertClaim,
  recordEvidence,
  recordTrace,
  findCachedTopic,
  upsertTopicMemory,
} from "../_shared/memory.ts";
import { serviceClient } from "../_shared/supa.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { action, payload } = await req.json();
    switch (action) {
      case "findSimilarClaim": {
        const r = await findSimilarClaim(payload.text, payload.threshold ?? 0.85);
        return jsonResponse({ claim: r });
      }
      case "upsertClaim": {
        const r = await upsertClaim(payload);
        return jsonResponse(r);
      }
      case "recordEvidence": {
        await recordEvidence(payload.claimId, payload.url, payload.stance, payload.excerpt);
        return jsonResponse({ ok: true });
      }
      case "recordTrace": {
        await recordTrace(payload);
        return jsonResponse({ ok: true });
      }
      case "findCachedTopic": {
        const r = await findCachedTopic(payload.topic);
        return jsonResponse({ topic: r });
      }
      case "upsertTopicMemory": {
        await upsertTopicMemory(payload.topic, payload.summary, payload.entities ?? []);
        return jsonResponse({ ok: true });
      }
      case "getSourceScore": {
        const supa = serviceClient();
        const { data } = await supa
          .from("sources")
          .select("*")
          .eq("domain", payload.domain)
          .maybeSingle();
        return jsonResponse({ source: data });
      }
      default:
        return jsonResponse({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error("memory-service error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
