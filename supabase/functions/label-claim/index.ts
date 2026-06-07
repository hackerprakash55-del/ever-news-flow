import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supa.ts";
import { blendReliability, domainOf } from "../_shared/trust.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireAdmin(req.headers.get("Authorization"));
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const { claim_id, label, rationale } = await req.json();
    if (!claim_id || !label) return jsonResponse({ error: "claim_id and label required" }, 400);
    if (!["true", "false", "misleading", "unverifiable"].includes(label)) {
      return jsonResponse({ error: "invalid label" }, 400);
    }

    const supa = serviceClient();

    // 1. Insert label.
    const { data: labelRow, error: insErr } = await supa
      .from("ground_truth_labels")
      .insert({ claim_id, label, rationale: rationale ?? null, labeled_by: auth.userId })
      .select("*")
      .single();
    if (insErr) throw insErr;

    // 2. Update claim status.
    const newStatus = label === "true"
      ? "verified"
      : label === "false" || label === "misleading"
        ? "disputed"
        : "unverified";
    const newConfidence = label === "true" ? 0.95 : label === "false" ? 0.05 : label === "misleading" ? 0.2 : 0.4;
    await supa
      .from("claims")
      .update({ status: newStatus, confidence: newConfidence, updated_at: new Date().toISOString() })
      .eq("id", claim_id);

    // 3. Recompute historical_accuracy for every source linked via evidence.
    const { data: ev } = await supa
      .from("claim_evidence")
      .select("source_id, url, sources(reliability_score, historical_accuracy, domain)")
      .eq("claim_id", claim_id);

    const outcome: "verified" | "refuted" | "neutral" = label === "true"
      ? "verified"
      : (label === "false" || label === "misleading")
        ? "refuted"
        : "neutral";
    const updated: string[] = [];
    for (const row of ev ?? []) {
      const src = (row as { sources?: { reliability_score?: number; historical_accuracy?: number; domain?: string } }).sources;
      const sid = (row as { source_id?: string }).source_id;
      if (!sid || !src) continue;
      const newRel = blendReliability(Number(src.reliability_score ?? 0.5), outcome, 0.08);
      const newHist = blendReliability(Number(src.historical_accuracy ?? 0.5), outcome, 0.1);
      await supa
        .from("sources")
        .update({ reliability_score: newRel, historical_accuracy: newHist })
        .eq("id", sid);
      updated.push(src.domain ?? domainOf((row as { url?: string }).url ?? ""));
    }

    return jsonResponse({
      ok: true,
      label: labelRow,
      claim_status: newStatus,
      sources_updated: updated,
    });
  } catch (e) {
    console.error("label-claim error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});