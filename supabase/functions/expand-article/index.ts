// expand-article: on-demand full body for a single story.
// Called lazily from the article page when the feed only has a short teaser.
// Uses the same Lovable AI (Gemini) expansion path as fetch-news.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function expandArticleBody(
  title: string,
  description: string,
  partialContent: string,
  sourceName: string,
  publishedAt: string,
  lovableApiKey: string | undefined,
): Promise<string> {
  const knownFacts = [title, description, partialContent].filter(Boolean).join("\n");
  if (!lovableApiKey) return partialContent || description;

  const messages = [
    {
      role: "system",
      content: `You are a professional news journalist writing for GAINN, an AI-assisted Indian news network.
Write detailed, informative news article bodies using ONLY verified facts provided.
STRICT RULES:
- Only use facts directly derived from the provided information
- Do NOT invent quotes, statistics, names, dates, or claims not in the source material
- Do NOT speculate or add opinion
- Expand with universally-known factual background/context if source material is limited
- Write in professional third-person journalistic style
- 4-6 paragraphs, 2-4 sentences each
- Separate paragraphs with a blank line`,
    },
    {
      role: "user",
      content: `Source: "${sourceName}" (published ${publishedAt})

VERIFIED SOURCE MATERIAL:
${knownFacts}

Write the article body now:`,
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.2,
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    console.error("expand-article AI error:", response.status);
    return partialContent || description;
  }
  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;
  return text?.trim() || partialContent || description;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { headline, summary, content, source, publishedAt } = await req.json();
    if (!headline || typeof headline !== "string") {
      return new Response(JSON.stringify({ error: "headline required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await expandArticleBody(
      headline,
      typeof summary === "string" ? summary : "",
      typeof content === "string" ? content : "",
      typeof source === "string" ? source : "Unknown Source",
      typeof publishedAt === "string" ? publishedAt : new Date().toISOString(),
      Deno.env.get("LOVABLE_API_KEY"),
    );

    return new Response(JSON.stringify({ body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("expand-article error:", e);
    return new Response(JSON.stringify({ error: "expansion failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
