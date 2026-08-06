import { supabase } from "@/integrations/supabase/client";

export interface TtsResult {
  /** Blob URL for an <audio> element, or null if the server voice failed. */
  audioUrl: string | null;
  /** Optional user-facing message about the fallback path. */
  message?: string;
}

/**
 * Once the server voice fails (quota, missing key, timeout) we stop calling it
 * for the rest of the session — otherwise every story pays a slow network
 * round-trip before falling back to the browser voice.
 */
let premiumDisabled = false;
export function isPremiumVoiceDisabled() {
  return premiumDisabled;
}

/**
 * Request premium narration from the ElevenLabs edge function.
 * Returns a blob URL for a native <audio> element on success, or `{ audioUrl: null }`
 * when the server voice is unavailable — callers should then use Web Speech.
 */
export async function fetchNarration(script: string, title?: string): Promise<TtsResult> {
  if (premiumDisabled) return { audioUrl: null };
  try {
    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: { script, title },
    });
    if (error || !data?.audioContent || data?.useClientFallback) {
      premiumDisabled = true;
      return { audioUrl: null, message: data?.error ?? error?.message };
    }
    const contentType = data.contentType || "audio/mpeg";
    return { audioUrl: `data:${contentType};base64,${data.audioContent}` };
  } catch (err) {
    console.warn("fetchNarration failed:", err);
    premiumDisabled = true;
    return { audioUrl: null, message: (err as Error)?.message };
  }
}

export function releaseNarration(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) {
    try { URL.revokeObjectURL(url); } catch { /* noop */ }
  }
}