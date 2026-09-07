import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Sarvam bulbul:v2 — Indian-accent, multilingual news narration.
const SPEAKER = "anushka";
const MODEL = "bulbul:v2";
const MAX_CHARS = 1400; // keep a single fast request

const SUPPORTED = new Set([
  "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN",
  "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      return json({ error: "Sarvam voice is not configured.", useClientFallback: true });
    }

    const body = await req.json().catch(() => ({}));
    const script = typeof body.script === "string" ? body.script : "";
    const title = typeof body.title === "string" ? body.title : "";
    const requested = typeof body.language === "string" ? body.language : "en-IN";
    const language = SUPPORTED.has(requested) ? requested : "en-IN";

    if (!script.trim()) return json({ error: "script is required" }, 400);

    const clean = script
      .replace(/\*\*[A-Z\s]+\*\*/g, "")
      .replace(/#{1,3}\s+\w+/g, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const intro = language === "hi-IN" ? "गेन रिपोर्ट। " : "GAINN report. ";
    const merged = `${title ? `${intro}${title}. ` : intro}${clean}`.trim();
    const text = merged.length > MAX_CHARS
      ? `${merged.slice(0, MAX_CHARS).replace(/\s+\S*$/, "")}.`
      : merged;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target_language_code: language,
        speaker: SPEAKER,
        model: MODEL,
        pace: 1.0,

      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const errText = await res.text();
      console.error("Sarvam TTS error:", res.status, errText);
      return json({ error: "Sarvam voice unavailable.", useClientFallback: true, status: res.status });
    }

    const data = await res.json();
    const audios: string[] = Array.isArray(data?.audios) ? data.audios : [];
    if (!audios.length) {
      return json({ error: "Sarvam returned no audio.", useClientFallback: true });
    }

    // Sarvam returns base64 WAV chunks; the first chunk covers our capped text.
    return json({
      audioContent: audios[0],
      contentType: "audio/wav",
      language,
      provider: "sarvam",
      truncated: merged.length > MAX_CHARS,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("sarvam-tts error:", err);
    return json({ error: "Voice service timed out.", useClientFallback: true });
  }
});
