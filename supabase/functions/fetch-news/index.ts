import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── In-memory response cache ──────────────────────────────────────────────
// NewsAPI developer plan is limited to 100 req / 24h. Cache successful
// responses per (category|location|pageSize|q) for CACHE_TTL_MS, and serve
// STALE cached data when NewsAPI returns 429 / any error so the UI never
// blanks out with a rate-limit runtime error.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min fresh window matches client refetch
const STALE_MAX_MS = 6 * 60 * 60 * 1000; // serve stale up to 6h on upstream failure
interface CacheEntry { at: number; payload: unknown; }
const responseCache = new Map<string, CacheEntry>();
function cacheKey(category: string, location: string, pageSize: number, q: string, expand: boolean) {
  return `${category}|${location}|${pageSize}|${q}|${expand ? 1 : 0}`;
}

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
  [/\b(crime|murder|arrest|FIR|police|rape|fraud|scam|CBI|ED raid|encounter|kidnap|assault|robbery)\b/i, "Crime"],
  [/\b(ministry|scheme|cabinet|notification|Niti Aayog|RBI|budget|policy|governance|Rajya Sabha|Lok Sabha)\b/i, "Government"],
  [/\b(election|congress|senate|president|parliament|democrat|republican|vote|BJP|Modi|Rahul Gandhi|opposition|minister)\b/i, "Politics"],
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

// ── Article body expansion via Lovable AI Gateway ─────────────────────────

async function expandArticleBody(
  title: string,
  description: string,
  partialContent: string,
  sourceName: string,
  publishedAt: string,
  lovableApiKey: string
): Promise<string> {
  const knownFacts = [title, description, partialContent].filter(Boolean).join("\n");

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional news journalist writing for GAINN, a global AI-powered news network.
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
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("AI Gateway expand error:", response.status, errText);
    return partialContent || description;
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;
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
  const normalizedLocation = location.trim();
  const isIndia = !normalizedLocation || /^india$/i.test(normalizedLocation);
  // Trusted Indian news sources for /everything queries — gives us far more
  // local coverage (crime, state govt, political parties, regional issues)
  // than NewsAPI's tiny country=in top-headlines pool.
  const INDIA_DOMAINS = [
    "timesofindia.indiatimes.com",
    "thehindu.com",
    "hindustantimes.com",
    "ndtv.com",
    "indianexpress.com",
    "news18.com",
    "indiatoday.in",
    "livemint.com",
    "business-standard.com",
    "deccanherald.com",
    "thewire.in",
    "scroll.in",
    "firstpost.com",
    "moneycontrol.com",
    "financialexpress.com",
    "theprint.in",
  ].join(",");

  // India-first fast path with rich local-category coverage.
  if (isIndia) {
    const everything = (q: string) =>
      `${base}/everything?q=${encodeURIComponent(q)}&domains=${INDIA_DOMAINS}&${langParam}&sortBy=publishedAt&${sizeParam}&apiKey=${apiKey}`;

    switch (category) {
      case "AI":
        return everything("India AND (AI OR \"artificial intelligence\" OR ChatGPT OR startup OR IT)");
      case "Environment":
        return everything("India AND (climate OR environment OR pollution OR monsoon OR flood OR heatwave)");
      case "Politics":
        return everything("India AND (BJP OR Congress OR Modi OR Rahul OR parliament OR \"Lok Sabha\" OR \"Rajya Sabha\" OR election OR minister OR CM OR opposition)");
      case "Crime":
        return everything("India AND (crime OR murder OR arrest OR police OR FIR OR rape OR fraud OR scam OR CBI OR ED OR raid OR encounter)");
      case "Government":
        return everything("India AND (government OR ministry OR scheme OR policy OR Modi OR cabinet OR budget OR RBI OR Niti Aayog OR notification)");
      case "Economy":
        return everything("India AND (economy OR GDP OR inflation OR RBI OR Sensex OR Nifty OR rupee OR budget OR business OR IPO)");
      case "Technology":
        return everything("India AND (technology OR tech OR startup OR Infosys OR TCS OR Wipro OR Reliance OR Jio OR smartphone)");
      case "Science":
        return everything("India AND (ISRO OR Chandrayaan OR science OR research OR IIT OR IISc)");
      case "Health":
        return everything("India AND (health OR AIIMS OR hospital OR disease OR vaccine OR dengue OR outbreak)");
      case "Sports":
        return everything("India AND (cricket OR IPL OR BCCI OR Kohli OR Rohit OR hockey OR Olympics OR badminton)");
      case "Entertainment":
        return everything("India AND (Bollywood OR film OR movie OR Shah Rukh OR Salman OR box office OR OTT)");
      case "Global Affairs":
        return everything("India AND (foreign OR diplomacy OR China OR Pakistan OR US OR G20 OR UN OR border)");
      default:
        // "all" or unknown: broad India-local firehose.
        return everything("India OR Delhi OR Mumbai OR Bengaluru OR Chennai OR Kolkata OR Hyderabad OR Modi OR BJP OR Congress");
    }
  }

  // Location-based query takes priority — use /everything with geo query
  if (normalizedLocation && normalizedLocation !== "Global") {
    const locQuery = encodeURIComponent(`("${normalizedLocation}" AND India) OR "${normalizedLocation}"`);
    let catExtra = "";
    if (category === "AI") catExtra = `+OR+(artificial+intelligence+OR+ChatGPT+OR+OpenAI)`;
    else if (category === "Technology") catExtra = `+OR+technology`;
    else if (category === "Economy") catExtra = `+OR+economy+OR+business`;
    else if (category === "Politics") catExtra = `+OR+politics+OR+election+OR+minister`;
    else if (category === "Crime") catExtra = `+OR+crime+OR+police+OR+arrest+OR+FIR`;
    else if (category === "Government") catExtra = `+OR+government+OR+ministry+OR+scheme+OR+policy`;
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
    const location = url.searchParams.get("location") || "India";
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") || "20"), 30);
    const searchQuery = url.searchParams.get("q") || ""; // free-text keyword search
    const shouldExpand = url.searchParams.get("expand") === "true";

    const t0 = Date.now();

    // ── Serve fresh cache immediately if within TTL ──
    const ckey = cacheKey(category, location, pageSize, searchQuery, shouldExpand);
    const cached = responseCache.get(ckey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ ...(cached.payload as object), cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Phase 2: feature-flagged routing through the multi-agent newsroom ──
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    let flagEnabled = false;
    let rolloutPct = 0;
    let route: "orchestrator" | "fallback" = "fallback";
    let fallbackReason: string | null = null;
    let orchestratorVerification: {
      runId?: string;
      consensusScore?: number;
      claimIds?: string[];
      topic?: string;
    } | null = null;
    const svc = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;
    // Verification is intentionally opt-in. Reading rollout settings and
    // starting the multi-agent newsroom on every normal feed request adds
    // backend latency but does not change the article list.
    const shouldVerify = url.searchParams.get("verify") === "true";
    if (shouldVerify && svc) {
      try {
        const { data: flag } = await svc
          .from("app_settings")
          .select("value")
          .eq("key", "newsroom_pipeline")
          .maybeSingle();
        const v = (flag?.value ?? {}) as { enabled?: boolean; rollout_pct?: number };
        flagEnabled = !!v.enabled;
        rolloutPct = Number(v.rollout_pct ?? 0);
      } catch (_) { /* ignore */ }
    }
    const rollDice = flagEnabled && Math.random() * 100 < rolloutPct;

    // If the flag rolled, fire the orchestrator in parallel with NewsAPI on
    // the dominant topic (search query or category). We never block longer
    // than 12s on it — NewsAPI results are returned either way.
    const orchestratorTopic = (searchQuery || (category !== "all" ? category : "")).trim();
    let orchestratorPromise: Promise<Response> | null = null;
    if (rollDice && orchestratorTopic && SUPABASE_URL && SUPABASE_ANON_KEY) {
      orchestratorPromise = fetch(`${SUPABASE_URL}/functions/v1/newsroom-orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ topic: orchestratorTopic, threshold: 0.7 }),
      });
    }

    // If a free-text search query is provided, override category routing
    // and use NewsAPI /everything with the keyword
    let newsApiUrl: string;
    if (searchQuery) {
      const encoded = encodeURIComponent(location ? `${searchQuery} ${location}` : searchQuery);
      newsApiUrl = `https://newsapi.org/v2/everything?q=${encoded}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${NEWSAPI_KEY}`;
    } else {
      newsApiUrl = buildNewsApiUrl(category, location, pageSize, NEWSAPI_KEY);
    }

    console.log(`Fetching: category=${category}, location=${location}, pageSize=${pageSize}${searchQuery ? `, q="${searchQuery}"` : ""}`);
    const newsController = new AbortController();
    const newsTimeout = setTimeout(() => newsController.abort(), 4_500);
    let response: Response;
    let data: any;
    try {
      response = await fetch(newsApiUrl, { signal: newsController.signal });
      data = await response.json();
    } catch (netErr) {
      clearTimeout(newsTimeout);
      if (cached && Date.now() - cached.at < STALE_MAX_MS) {
        return new Response(JSON.stringify({ ...(cached.payload as object), cached: true, stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw netErr;
    }
    clearTimeout(newsTimeout);

    if (!response.ok || data?.status !== "ok") {
      console.error("NewsAPI error:", data);
      // Fall back to stale cache so the app keeps working through rate limits.
      if (cached && Date.now() - cached.at < STALE_MAX_MS) {
        return new Response(JSON.stringify({ ...(cached.payload as object), cached: true, stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Return 200 with fallback signal so the client SDK does not throw
      // a runtime error on upstream rate-limit / server outages.
      const fallbackPayload = {
          error: data?.message || "NewsAPI request failed",
          code: data?.code,
          fallback: true,
          articles: [],
          totalResults: 0,
        };
      // Cache upstream failures briefly as well. This prevents every visitor
      // from repeatedly hitting an already rate-limited provider.
      responseCache.set(ckey, { at: Date.now(), payload: fallbackPayload });
      return new Response(
        JSON.stringify(fallbackPayload),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawArticles = (data.articles || []).filter(
      (a: any) => a.title && a.title !== "[Removed]" && a.description && a.description !== "[Removed]"
    );

    // Expansion is opt-in. The live feed must return fast for India/local news.
    const toExpand = shouldExpand ? rawArticles.slice(0, Math.min(rawArticles.length, 1)) : [];
    const rest = rawArticles.slice(toExpand.length);
    let expandedBodies: string[] = [];

    if (LOVABLE_API_KEY) {
      console.log(`Expanding ${toExpand.length} article bodies with Gemini...`);
      // Race each AI call against a 4-second timeout so one slow model call
      // never holds up the entire response.
      const withTimeout = (p: Promise<string>, fallback: string) =>
        Promise.race([p, new Promise<string>((res) => setTimeout(() => res(fallback), 1500))]);

      expandedBodies = await Promise.all(
        toExpand.map((a: any) =>
          withTimeout(
            expandArticleBody(
              a.title || "",
              a.description || "",
              a.content ? a.content.replace(/\[\+\d+ chars\]$/, "").trim() : "",
              a.source?.name || "Unknown Source",
              a.publishedAt || new Date().toISOString(),
              LOVABLE_API_KEY
            ),
            a.content || a.description || ""
          ).catch(() => a.content || a.description || "")
        )
      );
    }

    const displayLocation = location || (category !== "all" ? category : "Global");
    const articles = [
      ...toExpand.map((a: any, i: number) => mapNewsApiArticle(a, i, displayLocation, expandedBodies[i])),
      ...rest.map((a: any, i: number) => mapNewsApiArticle(a, toExpand.length + i, displayLocation)),
    ];

    console.log(`Returning ${articles.length} articles (${expandedBodies.length} AI-expanded, location="${location}")`);

    // ── Await orchestrator (bounded) and attach verification metadata ──
    if (orchestratorPromise) {
      try {
        const orchRes = await Promise.race([
          orchestratorPromise,
          new Promise<null>((res) => setTimeout(() => res(null), 2000)),
        ]);
        if (orchRes && orchRes.ok) {
          const orchJson = await orchRes.json();
          route = "orchestrator";
          orchestratorVerification = {
            runId: orchJson.runId,
            consensusScore: orchJson.consensusScore,
            claimIds: orchJson.claimIds ?? [],
            topic: orchJson.topic,
          };
          // Tag the first article with verification metadata for the UI.
          if (articles[0] && typeof orchJson.consensusScore === "number") {
            (articles[0] as any).verification = {
              consensus: orchJson.consensusScore,
              thresholdMet: !!orchJson.thresholdMet,
              runId: orchJson.runId,
              claimCount: orchJson.claimCount ?? 0,
              source: "newsroom-orchestrator",
            };
          }
        } else {
          fallbackReason = orchRes ? `orchestrator http ${orchRes.status}` : "orchestrator timeout";
        }
      } catch (e) {
        fallbackReason = `orchestrator error: ${e instanceof Error ? e.message : "unknown"}`;
      }
    } else if (rollDice) {
      fallbackReason = "missing topic or service env";
    } else if (flagEnabled) {
      fallbackReason = "rollout dice miss";
    } else {
      fallbackReason = "flag disabled";
    }

    // Log routing decision (best-effort, never throws to caller).
    if (svc) {
      svc.from("pipeline_decisions").insert({
        endpoint: "fetch-news",
        route,
        category,
        region: location || null,
        topic: orchestratorTopic || null,
        rollout_pct: rolloutPct,
        flag_enabled: flagEnabled,
        latency_ms: Date.now() - t0,
        fallback_reason: fallbackReason,
        run_id: orchestratorVerification?.runId ?? null,
      }).then(() => {}, (err) => console.warn("pipeline_decisions insert:", err?.message));
    }

    const payload = {
      articles,
      totalResults: data.totalResults,
      source: "NewsAPI + Gemini",
      fetchedAt: new Date().toISOString(),
      location: location || null,
      verification: orchestratorVerification,
      route,
    };
    responseCache.set(ckey, { at: Date.now(), payload });
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-news error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
