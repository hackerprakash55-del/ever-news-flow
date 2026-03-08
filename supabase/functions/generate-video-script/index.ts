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

    const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
    const { topic, category } = await req.json();

    // 1. Fetch latest headlines for the topic/category
    let headlines: string[] = [];
    let articleSummaries: string[] = [];

    if (NEWSAPI_KEY) {
      const q = topic || category || "world news";
      const newsUrl = `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&q=${encodeURIComponent(q)}&apiKey=${NEWSAPI_KEY}`;
      try {
        const newsRes = await fetch(newsUrl);
        const newsData = await newsRes.json();
        if (newsData.articles) {
          headlines = newsData.articles
            .filter((a: any) => a.title && a.title !== "[Removed]")
            .slice(0, 8)
            .map((a: any) => a.title);
          articleSummaries = newsData.articles
            .filter((a: any) => a.description && a.description !== "[Removed]")
            .slice(0, 5)
            .map((a: any) => `- ${a.title}: ${a.description}`);
        }
      } catch (e) {
        console.error("NewsAPI fetch failed:", e);
      }
    }

    const topicLabel = topic || category || "Global Affairs";
    const headlineContext = headlines.length > 0
      ? `\n\nCurrent live headlines on this topic:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nKey story summaries:\n${articleSummaries.join("\n")}`
      : "";

    const systemPrompt = `You are GAINN's senior AI news anchor and scriptwriter. You produce professional, long-form video news scripts for the Global AI News Network.

STRICT EDITORIAL RULES:
- Always present MULTIPLE perspectives on every issue — never favor one side
- Use neutral, factual, precise language — no emotional or politically charged words
- Cite sources and regions whenever possible
- Acknowledge uncertainty with phrases like "according to reports", "officials say", "sources indicate"
- End every segment with context, not conclusions
- Structure: Opening Hook → Background → Key Developments → Multiple Viewpoints → Global Impact → Closing Context

FORMAT YOUR OUTPUT EXACTLY LIKE THIS:
[TITLE]: The video title
[DURATION]: Estimated duration in minutes
[CATEGORY]: News category
[THUMBNAIL_PROMPT]: A cinematic, photorealistic image description for the video thumbnail (no text, no faces)
[SCRIPT]:
The full anchor script with clear section headers like **OPENING**, **BACKGROUND**, **KEY DEVELOPMENTS**, **PERSPECTIVES**, **GLOBAL IMPACT**, **CLOSING**

Each section should be substantial (150-300 words). Total script should be 800-1200 words for a 6-10 minute video.`;

    const userPrompt = `Create a professional, neutral long-form video news script about: "${topicLabel}"${headlineContext}

Make it a 6-10 minute deep-dive video that covers all sides of the story with global context. The tone should be authoritative but accessible, like a premium documentary news channel.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached — please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required — please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const rawScript = aiData.choices?.[0]?.message?.content || "";

    // Parse structured fields from the script
    const titleMatch = rawScript.match(/\[TITLE\]:\s*(.+)/);
    const durationMatch = rawScript.match(/\[DURATION\]:\s*(.+)/);
    const categoryMatch = rawScript.match(/\[CATEGORY\]:\s*(.+)/);
    const thumbnailMatch = rawScript.match(/\[THUMBNAIL_PROMPT\]:\s*(.+)/);
    const scriptMatch = rawScript.match(/\[SCRIPT\]:\s*([\s\S]+)/);

    return new Response(
      JSON.stringify({
        title: titleMatch?.[1]?.trim() || `GAINN Report: ${topicLabel}`,
        duration: durationMatch?.[1]?.trim() || "6-8 min",
        category: categoryMatch?.[1]?.trim() || topicLabel,
        thumbnailPrompt: thumbnailMatch?.[1]?.trim() || `Cinematic global news broadcast studio, ${topicLabel}, dramatic lighting, professional news set`,
        script: scriptMatch?.[1]?.trim() || rawScript,
        rawHeadlines: headlines,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-video-script error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
