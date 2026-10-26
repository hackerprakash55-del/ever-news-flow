// expand-article: on-demand full body for a single story.
// Called lazily from the article page when the feed only has a short teaser.
// Uses Lovable AI (Gemini) with OpenRouter as an optional first choice,
// mirroring fetch-news' expandArticleBody but for one article per request.

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
  openRouterApiKey: string | undefined,
  lovableApiKey: string | undefined,
): Promise<string> {
  const knownFacts = [title, description, partialContent].filter(Boolean).join("\n");
  const apiKey = openRouterApiKey ?? lovableApiKey;
  if (!apiKey) return partialContent || description;
  const endpoint = openRouterApiKey
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = openRouterApiKey
    ? "deepseek/deepseek-chat:free"
    : "google/gemini-3-flash-preview";

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

  const requestExpansion = (target: string, key: string, selectedModel: string) =>
    fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: selectedModel, messages, temperature: 0.2, max_tokens: 900 }),
    });

  let response = await requestExpansion(endpoint, apiKey, model);
  if (!response.ok && openRouterApiKey && lovableApiKey) {
    response = await requestExpansion(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      lovableApiKey,
      "google/gemini-3-flash-preview",
    );
  }
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
      Deno.env.get("OPENROUTER_API_KEY"),
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
