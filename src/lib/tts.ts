import { supabase } from "@/integrations/supabase/client";
import { getLanguage } from "@/lib/language";

export type TtsProvider = "sarvam" | "elevenlabs" | "browser";

export interface TtsResult {
  /** Data/blob URL for an <audio> element, or null if every server voice failed. */
  audioUrl: string | null;
  /** Optional user-facing message about the fallback path. */
  message?: string;
  /** Which voice produced the audio ("browser" means the caller should use Web Speech). */
  provider?: TtsProvider;
}

/**
 * Voice fallback queue.
 *
 * Providers are tried in order: Sarvam (Indian voices, all languages) →
 * ElevenLabs (multilingual backup) → browser Web Speech. When a provider
 * fails it is put on a cooldown instead of being disabled forever, so a
 * Sarvam credit top-up or a transient outage recovers automatically. A
 * quota/credit failure gets a longer cooldown than a timeout.
 */
const SHORT_COOLDOWN_MS = 2 * 60 * 1000;   // timeouts / transient errors
const LONG_COOLDOWN_MS = 15 * 60 * 1000;   // quota, credits exhausted, missing key

const cooldownUntil: Record<Exclude<TtsProvider, "browser">, number> = {
  sarvam: 0,
  elevenlabs: 0,
};

function isAvailable(p: Exclude<TtsProvider, "browser">) {
  return Date.now() >= cooldownUntil[p];
}

function benchProvider(p: Exclude<TtsProvider, "browser">, reason: "quota" | "transient") {
  cooldownUntil[p] = Date.now() + (reason === "quota" ? LONG_COOLDOWN_MS : SHORT_COOLDOWN_MS);
}

function classify(status?: number, error?: string): "quota" | "transient" {
  if (status === 401 || status === 402 || status === 403 || status === 429) return "quota";
  if (/quota|credit|not configured|blocked|unauthori[sz]ed|subscription/i.test(error ?? "")) return "quota";
  return "transient";
}

/** True when both server voices are cooling down (callers can skip straight to the browser). */
export function isPremiumVoiceDisabled() {
  return !isAvailable("sarvam") && !isAvailable("elevenlabs");
}

/** Snapshot of the queue state for status pills. */
export function voiceQueueStatus() {
  return {
    sarvam: isAvailable("sarvam"),
    elevenlabs: isAvailable("elevenlabs"),
    next: isAvailable("sarvam") ? "sarvam" : isAvailable("elevenlabs") ? "elevenlabs" : "browser",
  } as const;
}

async function trySarvam(script: string, title: string | undefined, lang: string): Promise<TtsResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("sarvam-tts", {
      body: { script, title, language: lang },
    });
    if (!error && data?.audioContent && !data?.useClientFallback) {
      const contentType = data.contentType || "audio/wav";
      return { audioUrl: `data:${contentType};base64,${data.audioContent}`, provider: "sarvam" };
    }
    benchProvider("sarvam", classify(data?.status, data?.error ?? error?.message));
  } catch (err) {
    console.warn("sarvam narration failed:", err);
    benchProvider("sarvam", "transient");
  }
  return null;
}

async function tryElevenLabs(script: string, title: string | undefined, lang: string): Promise<TtsResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: { script, title, language: lang },
    });
    if (!error && data?.audioContent && !data?.useClientFallback) {
      const contentType = data.contentType || "audio/mpeg";
      return { audioUrl: `data:${contentType};base64,${data.audioContent}`, provider: "elevenlabs" };
    }
    benchProvider("elevenlabs", classify(data?.status, data?.error ?? error?.message));
    return { audioUrl: null, message: data?.error ?? error?.message };
  } catch (err) {
    console.warn("elevenlabs narration failed:", err);
    benchProvider("elevenlabs", "transient");
    return { audioUrl: null, message: (err as Error)?.message };
  }
}

/**
 * Premium narration through the fallback queue. Resolves with a playable
 * audio URL, or `{ audioUrl: null, provider: "browser" }` so callers use
 * the browser voice — narration never stops dead.
 */
export async function fetchNarration(
  script: string,
  title?: string,
  language?: string,
): Promise<TtsResult> {
  const lang = language || getLanguage();
  const key = cacheKey(script, lang);
  const hit = prefetched.get(key);
  if (hit) { prefetched.delete(key); return hit; }

  let lastMessage: string | undefined;
  if (isAvailable("sarvam")) {
    const r = await trySarvam(script, title, lang);
    if (r) return r;
  }
  if (isAvailable("elevenlabs")) {
    const r = await tryElevenLabs(script, title, lang);
    if (r?.audioUrl) return r;
    lastMessage = r?.message;
  }
  return { audioUrl: null, provider: "browser", message: lastMessage };
}

// ── Prefetch queue: warm the next story's audio while the current one plays ──
const prefetched = new Map<string, TtsResult>();
const inflight = new Map<string, Promise<void>>();
const MAX_PREFETCH = 4;

function cacheKey(script: string, lang: string) {
  return `${lang}:${script.slice(0, 200)}`;
}

/** Fire-and-forget: generate narration for an upcoming story so playback is seamless. */
export function prefetchNarration(script: string, title?: string, language?: string) {
  const lang = language || getLanguage();
  const key = cacheKey(script, lang);
  if (prefetched.has(key) || inflight.has(key) || isPremiumVoiceDisabled()) return;
  if (prefetched.size >= MAX_PREFETCH) {
    const oldest = prefetched.keys().next().value;
    if (oldest) prefetched.delete(oldest);
  }
  const p = (async () => {
    const r = await fetchNarration(script, title, lang);
    if (r.audioUrl) prefetched.set(key, r);
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
}

export function releaseNarration(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) {
    try { URL.revokeObjectURL(url); } catch { /* noop */ }
  }
}
