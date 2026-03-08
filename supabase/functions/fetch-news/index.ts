import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOURCE_CATEGORY_MAP: Record<string, string> = {
  "techcrunch": "Technology",
  "the-verge": "Technology",
  "wired": "Technology",
  "ars-technica": "Technology",
  "engadget": "Technology",
  "bbc-news": "Global Affairs",
  "reuters": "Global Affairs",
  "associated-press": "Global Affairs",
  "the-guardian-uk": "Global Affairs",
  "cnn": "Politics",
  "fox-news": "Politics",
  "politico": "Politics",
  "bloomberg": "Economy",
  "financial-times": "Economy",
  "the-wall-street-journal": "Economy",
  "fortune": "Economy",
  "business-insider": "Economy",
  "new-scientist": "Science",
  "national-geographic": "Science",
  "scientific-american": "Science",
  "nasa": "Science",
  "environmental-health-news": "Environment",
  "medical-news-today": "Health",
  "health-news": "Health",
};

const KEYWORD_CATEGORY_MAP: [RegExp, string][] = [
  [/\b(AI|artificial intelligence|machine learning|GPT|LLM|neural network|ChatGPT|OpenAI|Anthropic|Google DeepMind)\b/i, "AI"],
  [/\b(quantum|physics|biology|chemistry|NASA|space|asteroid|mars|moon|telescope|genome|CERN)\b/i, "Science"],
  [/\b(climate|environment|carbon|emission|fossil|renewable|solar|wind|glacier|arctic|ocean|drought|wildfire)\b/i, "Environment"],
  [/\b(stock|market|economy|GDP|inflation|Fed|Federal Reserve|bank|cryptocurrency|bitcoin|crypto|interest rate|recession)\b/i, "Economy"],
  [/\b(election|congress|senate|president|parliament|government|democrat|republican|vote|policy|law|legislation)\b/i, "Politics"],
  [/\b(health|medical|drug|vaccine|hospital|FDA|cancer|covid|disease|treatment|clinical|pharma)\b/i, "Health"],
  [/\b(tech|software|hardware|startup|app|code|developer|cloud|cyber|hack|data breach)\b/i, "Technology"],
];

function guessCategory(title: string, description: string, sourceId: string): string {
  if (SOURCE_CATEGORY_MAP[sourceId]) return SOURCE_CATEGORY_MAP[sourceId];
  const text = `${title} ${description}`;
  for (const [pattern, cat] of KEYWORD_CATEGORY_MAP) {
    if (pattern.test(text)) return cat;
  }
  return "Global Affairs";
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`;
  const tags: string[] = [];
  const patterns: [RegExp, string][] = [
    [/\bAI\b|\bartificial intelligence\b/i, "AI"],
    [/\bquantum\b/i, "Quantum Computing"],
    [/\bclimate\b/i, "Climate"],
    [/\belection\b/i, "Elections"],
    [/\bNASA\b|\bspace\b/i, "Space"],
    [/\bcrypto\b|\bbitcoin\b/i, "Crypto"],
    [/\bvaccine\b/i, "Vaccine"],
    [/\bOpenAI\b/i, "OpenAI"],
    [/\bTech\b|\btechnology\b/i, "Technology"],
    [/\bUkraine\b/i, "Ukraine"],
    [/\bChina\b/i, "China"],
    [/\bUS\b|\bUnited States\b/i, "United States"],
    [/\bEU\b|\bEuropean Union\b/i, "EU"],
  ];
  for (const [re, tag] of patterns) {
    if (re.test(text)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 5);
}

// ── Gemini article body expansion ─────────────────────────────────────────

async function expandArticleBody(
  title: string,
  description: string,
  partialContent: string,
  sourceName: string,
  publishedAt: string,
  lovableApiKey: string
): Promise<string> {
  const knownFacts = [title, description, partialContent].filter(Boolean).join("\n");

  const prompt = `You are a professional news journalist writing for GAINN, a global AI-powered news network.

Using ONLY the verified facts below from "${sourceName}" (published ${publishedAt}), write a detailed, informative news article body of 4-6 paragraphs.

STRICT RULES:
- Only use facts that can be directly derived from the provided information
- Do NOT invent quotes, statistics, names, dates, or claims not present in the source material
- Do NOT speculate or add opinion
- If the source material is limited, expand with relevant factual background/context about the topic that is universally known (e.g., what the organization does, historical context)
- Write in professional third-person journalistic style
- Each paragraph should be 2-4 sentences
- Separate paragraphs with a blank line

VERIFIED SOURCE MATERIAL:
${knownFacts}

Write the article body now:`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": lovableApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      }),
    }
  );

  if (!response.ok) {
    console.error("Gemini expand error:", response.status);
    return partialContent || description;
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || partialContent || description;
}

// ── Map raw NewsAPI article ────────────────────────────────────────────────

function mapNewsApiArticle(raw: any, index: number, location: string, expandedBody?: string): object {
  const sourceId = raw.source?.id || "unknown";
  const sourceName = raw.source?.name || "Unknown Source";
  const title = raw.title || "Untitled";
  const description = raw.description || "";
  const category = guessCategory(title, description, sourceId);
  const rawBody = raw.content
    ? raw.content.replace(/\[\+\d+ chars\]$/, "").trim()
    : description;
  const body = expandedBody || rawBody || description;
  const credibilityScore = 75 + Math.floor(Math.random() * 22);
  const biasScore = parseFloat((Math.random() * 0.2 - 0.1).toFixed(3));

  return {
    id: `live-${Date.now()}-${index}`,
    headline: title,
    summary: description || title,
    body,
    category,
    credibilityScore,
    sources: [sourceName],
    publishedAt: raw.publishedAt || new Date().toISOString(),
    readTime: estimateReadTime(body),
    tags: extractTags(title, description),
    isBreaking: index < 2,
    region: location || "Global",
    imageUrl: raw.urlToImage || undefined,
    aiGenerated: false,
    biasScore,
    url: raw.url,
  };
}

// ── Build NewsAPI URL ──────────────────────────────────────────────────────

function buildNewsApiUrl(
  category: string,
  location: string,
  pageSize: number,
  apiKey: string
): string {
  const base = "https://newsapi.org/v2";
  const sizeParam = `pageSize=${pageSize}`;
  const langParam = "language=en";

  // Location-based query takes priority — use /everything with geo query
  if (location && location !== "" && location !== "Global") {
    const locQuery = encodeURIComponent(`"${location}"`);
    let catExtra = "";
    if (category === "AI") catExtra = `+OR+(artificial+intelligence+OR+ChatGPT+OR+OpenAI)`;
    else if (category === "Technology") catExtra = `+OR+technology`;
    else if (category === "Economy") catExtra = `+OR+economy+OR+business`;
    else if (category === "Politics") catExtra = `+OR+politics+OR+government`;
    else if (category === "Science") catExtra = `+OR+science+OR+research`;
    else if (category === "Environment") catExtra = `+OR+environment+OR+climate`;
    else if (category === "Health") catExtra = `+OR+health+OR+medical`;
    return `${base}/everything?q=${locQuery}${catExtra}&${langParam}&sortBy=publishedAt&${sizeParam}&apiKey=${apiKey}`;
  }

  // Category-only (no location)
  if (category === "all" || !category) {
    return `${base}/top-headlines?${langParam}&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "Technology") {
    return `${base}/top-headlines?category=technology&${langParam}&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "Economy") {
    return `${base}/top-headlines?category=business&${langParam}&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "Science" || category === "Health") {
    return `${base}/top-headlines?category=${category.toLowerCase()}&${langParam}&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "AI") {
    return `${base}/everything?q=artificial+intelligence+OR+ChatGPT+OR+OpenAI+OR+LLM&${langParam}&sortBy=publishedAt&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "Environment") {
    return `${base}/everything?q=climate+change+OR+environment+OR+renewable+energy&${langParam}&sortBy=publishedAt&${sizeParam}&apiKey=${apiKey}`;
  }
  if (category === "Politics") {
    return `${base}/top-headlines?category=politics&${langParam}&${sizeParam}&apiKey=${apiKey}`;
  }
  return `${base}/top-headlines?${langParam}&${sizeParam}&apiKey=${apiKey}`;
}

// ── Serve ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
    if (!NEWSAPI_KEY) {
      return new Response(
        JSON.stringify({ error: "NEWSAPI_KEY secret is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "all";
    const location = url.searchParams.get("location") || "";
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") || "20"), 30);
    const searchQuery = url.searchParams.get("q") || ""; // free-text keyword search

    // If a free-text search query is provided, override category routing
    // and use NewsAPI /everything with the keyword
    let newsApiUrl: string;
    if (searchQuery) {
      const encoded = encodeURIComponent(searchQuery);
      newsApiUrl = `https://newsapi.org/v2/everything?q=${encoded}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${NEWSAPI_KEY}`;
    } else {
      newsApiUrl = buildNewsApiUrl(category, location, pageSize, NEWSAPI_KEY);
    }

    console.log(`Fetching: category=${category}, location=${location}, pageSize=${pageSize}`);
    const response = await fetch(newsApiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("NewsAPI error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "NewsAPI request failed", code: data.code }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.status !== "ok") {
      return new Response(
        JSON.stringify({ error: data.message || "NewsAPI returned error status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawArticles = (data.articles || []).filter(
      (a: any) => a.title && a.title !== "[Removed]" && a.description && a.description !== "[Removed]"
    );

    // Expand up to 10 article bodies with Gemini
    const toExpand = rawArticles.slice(0, Math.min(rawArticles.length, 10));
    const rest = rawArticles.slice(toExpand.length);
    let expandedBodies: string[] = [];

    if (LOVABLE_API_KEY) {
      console.log(`Expanding ${toExpand.length} article bodies with Gemini...`);
      expandedBodies = await Promise.all(
        toExpand.map((a: any) =>
          expandArticleBody(
            a.title || "",
            a.description || "",
            a.content ? a.content.replace(/\[\+\d+ chars\]$/, "").trim() : "",
            a.source?.name || "Unknown Source",
            a.publishedAt || new Date().toISOString(),
            LOVABLE_API_KEY
          ).catch((e) => {
            console.error("Expand failed:", e);
            return a.content || a.description || "";
          })
        )
      );
    }

    const displayLocation = location || (category !== "all" ? category : "Global");
    const articles = [
      ...toExpand.map((a: any, i: number) => mapNewsApiArticle(a, i, displayLocation, expandedBodies[i])),
      ...rest.map((a: any, i: number) => mapNewsApiArticle(a, toExpand.length + i, displayLocation)),
    ];

    console.log(`Returning ${articles.length} articles (${expandedBodies.length} AI-expanded, location="${location}")`);

    return new Response(
      JSON.stringify({
        articles,
        totalResults: data.totalResults,
        source: "NewsAPI + Gemini",
        fetchedAt: new Date().toISOString(),
        location: location || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-news error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
