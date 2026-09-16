// OpenRouter-first chat client with Lovable AI fallback and existing retry/backoff.
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1";
const OPENROUTER_GATEWAY = "https://openrouter.ai/api/v1";
const OPENROUTER_CHAT_MODEL = "deepseek/deepseek-chat:free";

export const MODELS = {
  fast: "google/gemini-3-flash-preview",
  reasoning: "google/gemini-2.5-pro",
  cheap: "google/gemini-2.5-flash-lite",
  embed: "google/gemini-embedding-001",
} as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  responseFormat?: "json" | "text";
  maxRetries?: number;
}

export interface ChatResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  model: string;
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<ChatResult> {
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const key = openRouterKey ?? lovableKey;
  if (!key) throw new Error("OPENROUTER_API_KEY and LOVABLE_API_KEY are missing");
  const gateway = openRouterKey ? OPENROUTER_GATEWAY : LOVABLE_GATEWAY;
  const model = openRouterKey ? OPENROUTER_CHAT_MODEL : (opts.model ?? MODELS.fast);
  const body: Record<string, unknown> = { model, messages, stream: false };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.responseFormat === "json") {
    body.response_format = { type: "json_object" };
  }
  const maxRetries = opts.maxRetries ?? 2;
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      const res = await fetch(`${gateway}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        lastErr = new Error(`AI gateway ${res.status}`);
        continue;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI ${res.status}: ${txt.slice(0, 200)}`);
      }
      const j = await res.json();
      return {
        content: j.choices?.[0]?.message?.content ?? "",
        tokensIn: j.usage?.prompt_tokens ?? 0,
        tokensOut: j.usage?.completion_tokens ?? 0,
        latencyMs: Date.now() - start,
        model,
      };
    } catch (e) {
      lastErr = e as Error;
      if (attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr ?? new Error("AI request failed");
}

export function tryParseJson<T = unknown>(s: string): T | null {
  try {
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenced ? fenced[1] : s) as T;
  } catch {
    return null;
  }
}

export async function embed(text: string): Promise<number[]> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  // The requested OpenRouter chat model cannot create embeddings, so this
  // specialized modality intentionally remains on Lovable AI.
  const res = await fetch(`${LOVABLE_GATEWAY}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.embed,
      input: text.slice(0, 8000),
      dimensions: 1536,
    }),
  });
  if (!res.ok) {
    throw new Error(`Embed failed ${res.status}: ${await res.text()}`);
  }
  const j = await res.json();
  return j.data?.[0]?.embedding ?? [];
}
