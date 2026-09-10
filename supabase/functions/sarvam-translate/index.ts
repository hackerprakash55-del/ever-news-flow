import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPPORTED = new Set([
  "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN",
  "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN",
]);

const CHUNK = 900; // Sarvam translate input limit per request

function chunkText(text: string): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > CHUNK) {
    let cut = rest.lastIndexOf(". ", CHUNK);
    if (cut < CHUNK * 0.5) cut = CHUNK;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

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
    if (!SARVAM_API_KEY) return json({ error: "Translation is not configured." }, 200);

    const body = await req.json().catch(() => ({}));
    const texts: string[] = Array.isArray(body.texts)
      ? body.texts.filter((t: unknown) => typeof t === "string").slice(0, 40)
      : typeof body.text === "string" ? [body.text] : [];
    const target = typeof body.target === "string" && SUPPORTED.has(body.target) ? body.target : "hi-IN";

    if (!texts.length) return json({ error: "texts is required" }, 400);
    if (target === "en-IN") return json({ translations: texts, target });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const translateOne = async (input: string): Promise<string> => {
      const pieces = chunkText(input);
      const out: string[] = [];
      for (const piece of pieces) {
        const res = await fetch("https://api.sarvam.ai/translate", {
          method: "POST",
          headers: {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: piece,
            source_language_code: "en-IN",
            target_language_code: target,
            model: "sarvam-translate:v1",
            mode: "formal",
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.error("Sarvam translate error:", res.status, await res.text());
          return input; // graceful: keep original text
        }
        const data = await res.json();
        out.push(typeof data?.translated_text === "string" ? data.translated_text : piece);
      }
      return out.join(" ");
    };

    // Translate in parallel batches so a 20-story feed does not take 20 round-trips.
    const translations: string[] = new Array(texts.length);
    const CONCURRENCY = 8;
    for (let i = 0; i < texts.length; i += CONCURRENCY) {
      const slice = texts.slice(i, i + CONCURRENCY);
      const done = await Promise.all(slice.map((t) => translateOne(t)));
      done.forEach((d, j) => { translations[i + j] = d; });
    }
    clearTimeout(timeout);

    return json({ translations, target, provider: "sarvam" });
  } catch (err) {
    console.error("sarvam-translate error:", err);
    return json({ error: "Translation timed out." }, 200);
  }
});
