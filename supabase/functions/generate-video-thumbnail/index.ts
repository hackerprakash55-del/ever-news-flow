import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function fallbackThumbnail(title = "GAINN Live Report") {
  const safeTitle = title.replace(/[<>&]/g, "").slice(0, 90);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#060910"/><stop offset="1" stop-color="#172033"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1060" cy="130" r="190" fill="#06b6d4" opacity=".22"/><path d="M0 520 C280 420 470 610 760 500 S1040 410 1280 500 V720 H0Z" fill="#ef4444" opacity=".18"/><rect x="72" y="72" width="186" height="44" rx="22" fill="#ef4444"/><text x="98" y="101" fill="#fff" font-family="Arial" font-size="24" font-weight="700">GAINN LIVE</text><foreignObject x="78" y="235" width="870" height="250"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Georgia,serif;font-size:66px;line-height:1.05;color:white;font-weight:700">${safeTitle}</div></foreignObject><text x="82" y="642" fill="#94a3b8" font-family="Arial" font-size="26">Autonomous AI news briefing</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ imageUrl: fallbackThumbnail("GAINN Live Report"), fallback: true, error: "Image service unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { thumbnailPrompt, title } = await req.json();

    if (!thumbnailPrompt) {
      return new Response(
        JSON.stringify({ error: "thumbnailPrompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The requested OpenRouter DeepSeek chat model cannot generate images,
    // so this specialized image modality intentionally remains on Lovable AI.
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `${thumbnailPrompt}. Cinematic 16:9 news broadcast thumbnail, dramatic professional lighting, photorealistic, no text overlays, no watermarks, ultra detailed, high quality.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Image generation error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ imageUrl: fallbackThumbnail(title), fallback: true, error: "Rate limit reached" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ imageUrl: fallbackThumbnail(title), fallback: true, error: "AI credits required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ imageUrl: fallbackThumbnail(title), fallback: true, error: "Image generation failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(aiData)));
    const message = aiData.choices?.[0]?.message;
    console.log("Message keys:", JSON.stringify(message ? Object.keys(message) : null));

    // Try multiple possible response shapes
    let finalUrl: string | null = null;

    // Shape 1: images array (documented format)
    if (message?.images?.[0]?.image_url?.url) {
      finalUrl = message.images[0].image_url.url;
    }
    // Shape 2: content as array of parts
    else if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part?.type === "image_url" && part?.image_url?.url) {
          finalUrl = part.image_url.url;
          break;
        }
        if (part?.inline_data?.data) {
          finalUrl = `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
          break;
        }
      }
    }
    // Shape 3: content is a base64 string directly
    else if (typeof message?.content === "string" && message.content.startsWith("data:image")) {
      finalUrl = message.content;
    }

    if (!finalUrl) {
      console.error("No image in response. Full response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ imageUrl: fallbackThumbnail(title), fallback: true, error: "No image returned from AI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: finalUrl, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-video-thumbnail error:", err);
    return new Response(
      JSON.stringify({ imageUrl: fallbackThumbnail("GAINN Live Report"), fallback: true, error: "Thumbnail generation failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
