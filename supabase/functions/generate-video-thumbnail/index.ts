import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { thumbnailPrompt, title } = await req.json();

    if (!thumbnailPrompt) {
      return new Response(
        JSON.stringify({ error: "thumbnailPrompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI gateway image generation
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        prompt: `${thumbnailPrompt}. Cinematic 16:9 news broadcast thumbnail, dramatic professional lighting, photorealistic, no text, no watermarks, ultra detailed.`,
        n: 1,
        size: "1920x1080",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Image generation error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Image generation failed", details: errText }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData.data?.[0]?.url || aiData.data?.[0]?.b64_json;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image returned from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If b64_json, return as data URL
    const finalUrl = imageUrl.startsWith("http") ? imageUrl : `data:image/png;base64,${imageUrl}`;

    return new Response(
      JSON.stringify({ imageUrl: finalUrl, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-video-thumbnail error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
