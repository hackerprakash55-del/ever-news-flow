import { supabase } from "@/integrations/supabase/client";
import { getLanguage } from "@/lib/language";

export interface TtsResult {
  /** Data/blob URL for an <audio> element, or null if the server voice failed. */
  audioUrl: string | null;
  /** Optional user-facing message about the fallback path. */
  message?: string;
  /** Which voice produced the audio. */
  provider?: "sarvam" | "elevenlabs";
}

/**
 * Once a server voice fails (quota, missing key, timeout) we stop calling it
 * for the rest of the session — otherwise every story pays a slow network
 * round-trip before falling back to the browser voice.
 */
let sarvamDisabled = false;
let elevenDisabled = false;

export function isPremiumVoiceDisabled() {
  return sarvamDisabled && elevenDisabled;
}

/**
 * Premium narration: Sarvam (Indian voices, multilingual) first, ElevenLabs as
 * backup, then `{ audioUrl: null }` so callers use the browser voice.
 */
export async function fetchNarration(
  script: string,
  title?: string,
  language?: string,
): Promise<TtsResult> {
  const lang = language || getLanguage();

  if (!sarvamDisabled) {
    try {
      const { data, error } = await supabase.functions.invoke("sarvam-tts", {
        body: { script, title, language: lang },
      });
      if (!error && data?.audioContent && !data?.useClientFallback) {
        const contentType = data.contentType || "audio/wav";
        return { audioUrl: `data:${contentType};base64,${data.audioContent}`, provider: "sarvam" };
      }
      sarvamDisabled = true;
    } catch (err) {
      console.warn("sarvam narration failed:", err);
      sarvamDisabled = true;
    }
  }

  // Non-English narration is Sarvam-only; ElevenLabs stays the English backup.
  if (lang !== "en-IN" || elevenDisabled) return { audioUrl: null };

  try {
    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: { script, title },
    });
    if (error || !data?.audioContent || data?.useClientFallback) {
      elevenDisabled = true;
      return { audioUrl: null, message: data?.error ?? error?.message };
    }
    const contentType = data.contentType || "audio/mpeg";
    return { audioUrl: `data:${contentType};base64,${data.audioContent}`, provider: "elevenlabs" };
  } catch (err) {
    console.warn("fetchNarration failed:", err);
    elevenDisabled = true;
    return { audioUrl: null, message: (err as Error)?.message };
  }
}

export function releaseNarration(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) {
    try { URL.revokeObjectURL(url); } catch { /* noop */ }
  }
}
