import { useQuery } from "@tanstack/react-query";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { useCallback, useEffect, useMemo } from "react";
import { useLocalizedArticles } from "@/hooks/useLocalizedArticles";

// Map raw NewsAPI response shape to our Article type
function mapToArticle(raw: any): Article {
  const verification = raw.verification && typeof raw.verification === "object"
    ? raw.verification
    : undefined;
  return {
    id: raw.id || `live-${Date.now()}-${Math.random()}`,
    headline: raw.headline || raw.title || "Untitled",
    summary: raw.summary || raw.description || "",
    body: raw.body || raw.content || raw.description || "",
    category: raw.category || "Global Affairs",
    credibilityScore: verification?.credibility_score?.value,
    sources: Array.isArray(raw.sources) ? raw.sources : [raw.sources || "NewsAPI"],
    publishedAt: raw.publishedAt || new Date().toISOString(),
    readTime: raw.readTime ?? 3,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isBreaking: Boolean(raw.isBreaking),
    region: raw.region || "Global",
    imageUrl: raw.imageUrl || undefined,
    aiGenerated: Boolean(raw.aiGenerated),
    biasScore: typeof raw.biasScore === "number" ? raw.biasScore : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    verification,
  };
}

interface UseNewsOptions {
  category?: string;
  pageSize?: number;
  location?: string; // city / state / country string
  lang?: "en" | "hi"; // feed language (Hindi pulls Hindi-language Indian sources)
}

interface NewsResult {
  articles: Article[];
  isLive: boolean;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  fetchedAt: string | null;
  totalResults: number;
  isCached: boolean;
  isFallback: boolean;
  notice: string | null;
  refresh: () => void;
}

interface FetchNewsData {
  articles: Article[];
  isLive: boolean;
  fetchedAt: string | null;
  totalResults: number;
  isCached?: boolean;
  isFallback?: boolean;
  notice?: string | null;
}

const NEWS_CACHE_PREFIX = "gainn-news-v1";
const backgroundRefreshes = new Set<string>();

function browserCacheKey(category: string, location: string, lang = "en") {
  return `${NEWS_CACHE_PREFIX}:${category}:${location}:${lang}`;
}

function readBrowserCache(category: string, location: string, lang = "en"): FetchNewsData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(browserCacheKey(category, location, lang));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as FetchNewsData;
    return Array.isArray(parsed.articles) && parsed.articles.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeBrowserCache(category: string, location: string, data: FetchNewsData, lang = "en") {
  if (typeof window === "undefined" || data.articles.length === 0) return;
  try {
    window.localStorage.setItem(browserCacheKey(category, location, lang), JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing
  }
}

async function fetchLiveNews(category: string, pageSize: number, location: string, lang = "en"): Promise<FetchNewsData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase env vars missing");
  }

  const params = new URLSearchParams({
    category: category || "all",
    pageSize: String(pageSize),
  });
  if (location) params.set("location", location);
  if (lang === "hi") params.set("lang", "hi");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_000);

  let response: Response;
  try {
    response = await fetch(
      `${supabaseUrl}/functions/v1/fetch-news?${params}`,
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("News feed timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP ${response.status}`);
  }

  const json = await response.json();

  const result: FetchNewsData = {
    articles: (json.articles || []).map(mapToArticle) as Article[],
    isLive: !json.fallback && !json.stale,
    fetchedAt: json.fetchedAt || new Date().toISOString(),
    totalResults: json.totalResults || 0,
    isCached: Boolean(json.cached || json.stale),
    isFallback: Boolean(json.fallback),
    notice: json.notice || (json.stale ? "Live feed unavailable, showing latest cached stories." : null),
  };
  
  if (result.articles.length > 0) {
    writeBrowserCache(category, location, result, lang);
  }
  
  return result;
}

export function useNews({ category = "all", pageSize = 20, location = "India", lang = "en" }: UseNewsOptions = {}): NewsResult {
  const fetchSize = 30;
  const queryKey = ["news", category, location, lang];
  
  const cachedFeed = readBrowserCache(category, location, lang);
  // Only use mock data as last resort when no cache exists AND live fetch fails.
  // Mock data should never appear in production — it's a dev-only fallback.
  const isDevMode = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const immediateFeed: FetchNewsData = cachedFeed ?? {
    articles: isDevMode ? MOCK_ARTICLES : [],
    isLive: false,
    fetchedAt: null,
    totalResults: isDevMode ? MOCK_ARTICLES.length : 0,
    isCached: Boolean(cachedFeed),
    isFallback: !cachedFeed,
    notice: cachedFeed
      ? "Loading the latest feed; showing stories saved on this device."
      : isDevMode
        ? "Live feed unavailable, showing sample stories while we reconnect."
        : null, // No notice yet — wait for live fetch result
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchLiveNews(category, fetchSize, location, lang),
    initialData: immediateFeed,
    initialDataUpdatedAt: Date.now(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0,
  });

  useEffect(() => {
    const refreshKey = `${category}:${location}:${lang}`;
    if (backgroundRefreshes.has(refreshKey)) return;
    backgroundRefreshes.add(refreshKey);
    void refetch();
  }, [category, location, lang, refetch]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Use either the fresh data or the immediate (cached/mock) data
  const currentData = data || immediateFeed;

  // If live fetch returned empty and we have no cache, show mock only in dev mode
  const baseArticles = useMemo(
    () => {
      if (currentData.articles.length > 0) {
        return currentData.articles.slice(0, pageSize);
      }
      // Production: no articles available, show empty
      // Dev: fall back to mock for testing UI
      return isDevMode ? MOCK_ARTICLES.slice(0, pageSize) : [];
    },
    [currentData, pageSize, isDevMode],
  );
  // Headlines + summaries follow the reader's chosen language (Sarvam translation).
  const localized = useLocalizedArticles(baseArticles, pageSize);

  return {
    articles: localized,
    isLive: currentData.isLive,
    isLoading: isLoading && !data, // Only truly loading if we have no data at all
    isError: isError && !data,
    error: error instanceof Error ? error.message : null,
    fetchedAt: currentData.fetchedAt,
    totalResults: currentData.totalResults,
    isCached: Boolean(currentData.isCached),
    isFallback: Boolean(currentData.isFallback),
    notice: currentData.notice ?? null,
    refresh,
  };
}
