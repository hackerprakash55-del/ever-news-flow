import { chat, MODELS, tryParseJson, type ChatResult } from "./ai.ts";
import { recordTrace } from "./memory.ts";

export interface AgentCtx {
  runId: string;
  step: number;
}

// --- Discovery: pulls headlines + dedupes
export async function discoveryAgent(ctx: AgentCtx, topic: string) {
  const NEWSAPI = Deno.env.get("NEWSAPI_KEY");
  let headlines: Array<{ title: string; description: string; url: string; source: string }> = [];
  const start = Date.now();
  if (NEWSAPI) {
    try {
      const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=15&q=${encodeURIComponent(topic)}&apiKey=${NEWSAPI}`;
      const res = await fetch(url);
      const j = await res.json();
      headlines = (j.articles ?? [])
        .filter((a: { title?: string }) => a.title && a.title !== "[Removed]")
        .slice(0, 12)
        .map((a: { title: string; description?: string; url: string; source?: { name?: string } }) => ({
          title: a.title,
          description: a.description ?? "",
          url: a.url,
          source: a.source?.name ?? "unknown",
        }));
    } catch (e) {
      console.error("Discovery NewsAPI error:", e);
    }
  }
  await recordTrace({
    runId: ctx.runId,
    agent: "discovery",
    step: ctx.step,
    input: { topic },
    output: { count: headlines.length, samples: headlines.slice(0, 3) },
    latencyMs: Date.now() - start,
  });
  return headlines;
}

// --- Verification: extract atomic claims from headlines
export async function verificationAgent(
  ctx: AgentCtx,
  topic: string,
  headlines: Array<{ title: string; description: string; url: string }>,
) {
  const blob = headlines
    .map((h, i) => `${i + 1}. ${h.title} — ${h.description}`)
    .join("\n");
  const res = await chat(
    [
      {
        role: "system",
        content:
          "You extract atomic, verifiable factual claims from news. Output JSON: {claims:[{text,confidence,entities:[...]}]}. Max 8 claims. No opinions.",
      },
      { role: "user", content: `Topic: ${topic}\n\nHeadlines:\n${blob}` },
    ],
    { model: MODELS.fast, responseFormat: "json" },
  );
  const parsed = tryParseJson<{ claims?: Array<{ text: string; confidence?: number; entities?: string[] }> }>(res.content);
  const claims = (parsed?.claims ?? []).slice(0, 8);
  await recordTrace({
    runId: ctx.runId,
    agent: "verification",
    step: ctx.step,
    input: { topic, headlineCount: headlines.length },
    output: { claims },
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
  });
  return claims;
}

// --- Contradiction: actively search for refuting angles
export async function contradictionAgent(
  ctx: AgentCtx,
  claims: Array<{ text: string }>,
) {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "You are a skeptical fact-checker. For each claim, generate the strongest possible counter-argument or alternative interpretation. Output JSON: {checks:[{claim,counter,risk:0-1}]}.",
      },
      { role: "user", content: JSON.stringify(claims.map((c) => c.text)) },
    ],
    { model: MODELS.fast, responseFormat: "json" },
  );
  const parsed = tryParseJson<{ checks?: Array<{ claim: string; counter: string; risk: number }> }>(res.content);
  await recordTrace({
    runId: ctx.runId,
    agent: "contradiction",
    step: ctx.step,
    output: parsed,
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
  });
  return parsed?.checks ?? [];
}

// --- Reasoning: synthesize one consensus interpretation
export async function reasoningAgent(
  ctx: AgentCtx,
  topic: string,
  claims: unknown[],
  contradictions: unknown[],
  variant: number,
): Promise<{ summary: string; confidence: number; raw: ChatResult }> {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "You are a senior news editor. Synthesize a balanced, factual summary weighing evidence against contradictions. Output JSON: {summary, confidence: 0-1, key_points: [...]}",
      },
      {
        role: "user",
        content: `Topic: ${topic}\nVariant: ${variant}\nClaims: ${JSON.stringify(claims)}\nContradictions: ${JSON.stringify(contradictions)}`,
      },
    ],
    { model: MODELS.fast, responseFormat: "json", temperature: 0.3 + variant * 0.2 },
  );
  const parsed = tryParseJson<{ summary?: string; confidence?: number; key_points?: string[] }>(res.content);
  await recordTrace({
    runId: ctx.runId,
    agent: `reasoning-${variant}`,
    step: ctx.step,
    output: parsed,
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
  });
  return {
    summary: parsed?.summary ?? "",
    confidence: Number(parsed?.confidence ?? 0),
    raw: res,
  };
}

// --- Editorial: produces final article
export async function editorialAgent(
  ctx: AgentCtx,
  topic: string,
  consensusSummary: string,
  perspectives: unknown[],
) {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "You are GAINN's senior editor. Produce a publishable news article. Output JSON: {headline, deck, body (4-6 paragraphs), why_it_matters, whats_next, perspectives: {left, right, international}}.",
      },
      {
        role: "user",
        content: `Topic: ${topic}\nConsensus: ${consensusSummary}\nPerspectives input: ${JSON.stringify(perspectives)}`,
      },
    ],
    { model: MODELS.fast, responseFormat: "json" },
  );
  const parsed = tryParseJson<Record<string, unknown>>(res.content) ?? {};
  await recordTrace({
    runId: ctx.runId,
    agent: "editorial",
    step: ctx.step,
    output: parsed,
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
  });
  return parsed;
}

// --- Distribution: fans out to multiple formats
export async function distributionAgent(
  ctx: AgentCtx,
  article: Record<string, unknown>,
) {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "Convert this article into multiple formats. Output JSON: {short_summary (2 sentences), social_post (280 chars), video_script_short (60s), newsletter_blurb, podcast_intro}.",
      },
      { role: "user", content: JSON.stringify(article) },
    ],
    { model: MODELS.fast, responseFormat: "json" },
  );
  const parsed = tryParseJson<Record<string, unknown>>(res.content) ?? {};
  await recordTrace({
    runId: ctx.runId,
    agent: "distribution",
    step: ctx.step,
    output: parsed,
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
  });
  return parsed;
}
