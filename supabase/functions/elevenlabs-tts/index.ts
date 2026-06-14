import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// George - deep, authoritative news anchor voice
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs is not configured. Browser voice is available.", useClientFallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { script, title } = await req.json();
    if (!script) {
      return new Response(
        JSON.stringify({ error: "script is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean script for TTS: remove markdown formatting and section headers
    const cleanScript = script
      .replace(/\*\*[A-Z\s]+\*\*/g, "") // remove **SECTION** headers
      .replace(/#{1,3}\s+\w+/g, "")      // remove ## headers
      .replace(/\*\*/g, "")              // remove remaining bold markers
      .replace(/\n{3,}/g, "\n\n")        // collapse excessive newlines
      .trim();

    // Limit to ~4500 chars to stay within ElevenLabs limits
    const textToSpeak = cleanScript.length > 4500
      ? cleanScript.slice(0, 4500) + "..."
      : cleanScript;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSpeak,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.80,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);

      // Parse the actual ElevenLabs error detail
      let userMessage = "TTS generation failed";
      try {
        const parsed = JSON.parse(errText);
        const detail = parsed?.detail?.message || parsed?.detail?.status;
        if (detail?.includes("unusual_activity") || detail?.includes("Free Tier")) {
          userMessage = "ElevenLabs Free Tier is blocked from server environments. Please upgrade to a paid ElevenLabs plan, or use the browser voice-over below.";
        } else if (detail) {
          userMessage = detail;
        }
      } catch (_) { /* ignore parse errors */ }

      return new Response(
        JSON.stringify({ error: userMessage, useClientFallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = base64Encode(new Uint8Array(audioBuffer));

    return new Response(
      JSON.stringify({
        audioContent: audioBase64,
        contentType: response.headers.get("content-type") || "audio/mpeg",
        characterCount: textToSpeak.length,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("elevenlabs-tts error:", err);
    return new Response(
      JSON.stringify({ error: "Voice service timed out or failed. Browser voice is available.", useClientFallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
