import { supabase } from "@/integrations/supabase/client";

export interface TtsResult {
  /** Blob URL for an <audio> element, or null if the server voice failed. */
  audioUrl: string | null;
  /** Optional user-facing message about the fallback path. */
  message?: string;
}

/**
 * Request premium narration from the ElevenLabs edge function.
 * Returns a blob URL for a native <audio> element on success, or `{ audioUrl: null }`
 * when the server voice is unavailable — callers should then use Web Speech.
 */
export async function fetchNarration(script: string, title?: string): Promise<TtsResult> {
  try {
    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: { script, title },
    });
    if (error || !data?.audioContent || data?.useClientFallback) {
      return { audioUrl: null, message: data?.error ?? error?.message };
    }
    const binary = atob(data.audioContent as string);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: data.contentType || "audio/mpeg" });
    return { audioUrl: URL.createObjectURL(blob) };
  } catch (err) {
    console.warn("fetchNarration failed:", err);
    return { audioUrl: null, message: (err as Error)?.message };
  }
}

export function releaseNarration(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) {
    try { URL.revokeObjectURL(url); } catch { /* noop */ }
  }
}