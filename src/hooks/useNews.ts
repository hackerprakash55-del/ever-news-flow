import { useQuery } from "@tanstack/react-query";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { useCallback, useEffect } from "react";

// Map raw NewsAPI response shape to our Article type
function mapToArticle(raw: any): Article {
  return {
    id: raw.id || `live-${Date.now()}-${Math.random()}`,
    headline: raw.headline || raw.title || "Untitled",
    summary: raw.summary || raw.description || "",
    body: raw.body || raw.content || raw.description || "",
    category: raw.category || "Global Affairs",
    credibilityScore: raw.credibilityScore ?? 85,
    sources: Array.isArray(raw.sources) ? raw.sources : [raw.sources || "NewsAPI"],
    publishedAt: raw.publishedAt || new Date().toISOString(),
    readTime: raw.readTime ?? 3,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isBreaking: Boolean(raw.isBreaking),
    region: raw.region || "Global",
    imageUrl: raw.imageUrl || undefined,
    aiGenerated: Boolean(raw.aiGenerated),
    biasScore: typeof raw.biasScore === "number" ? raw.biasScore : 0,
  };
}

interface UseNewsOptions {
  category?: string;
  pageSize?: number;
  location?: string; // city / state / country string
}

interface NewsResult {
  articles: Article[];
  isLive: boolean;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  fetchedAt: string | null;
  totalResults: number;
  refresh: () => void;
}

interface FetchNewsData {
  articles: Article[];
  isLive: boolean;
  fetchedAt: string | null;
  totalResults: number;
}

const NEWS_CACHE_PREFIX = "gainn-news-v1";
const backgroundRefreshes = new Set<string>();

function browserCacheKey(category: string, location: string) {
  return `${NEWS_CACHE_PREFIX}:${category}:${location}`;
}

function readBrowserCache(category: string, location: string): FetchNewsData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(browserCacheKey(category, location));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as FetchNewsData;
    return Array.isArray(parsed.articles) && parsed.articles.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeBrowserCache(category: string, location: string, data: FetchNewsData) {
  if (typeof window === "undefined" || data.articles.length === 0) return;
  try {
    window.localStorage.setItem(browserCacheKey(category, location), JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing
  }
}

async function fetchLiveNews(category: string, pageSize: number, location: string): Promise<FetchNewsData> {
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

  if (json?.fallback && (!json.articles || json.articles.length === 0)) {
    throw new Error(json.error || "News source temporarily unavailable");
  }

  const result: FetchNewsData = {
    articles: (json.articles || []).map(mapToArticle) as Article[],
    isLive: true,
    fetchedAt: json.fetchedAt || new Date().toISOString(),
    totalResults: json.totalResults || 0,
  };
  
  if (result.articles.length > 0) {
    writeBrowserCache(category, location, result);
  }
  
  return result;
}

export function useNews({ category = "all", pageSize = 20, location = "India" }: UseNewsOptions = {}): NewsResult {
  const fetchSize = 30;
  const queryKey = ["news", category, location];
  
  const cachedFeed = readBrowserCache(category, location);
  const immediateFeed: FetchNewsData = cachedFeed ?? {
    articles: MOCK_ARTICLES,
    isLive: false,
    fetchedAt: null,
    totalResults: MOCK_ARTICLES.length,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchLiveNews(category, fetchSize, location),
    initialData: immediateFeed,
    initialDataUpdatedAt: Date.now(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0,
  });

  useEffect(() => {
    const refreshKey = `${category}:${location}`;
    if (backgroundRefreshes.has(refreshKey)) return;
    backgroundRefreshes.add(refreshKey);
    void refetch();
  }, [category, location, refetch]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Use either the fresh data or the immediate (cached/mock) data
  const currentData = data || immediateFeed;

  return {
    articles: (currentData.articles.length > 0 ? currentData.articles : MOCK_ARTICLES).slice(0, pageSize),
    isLive: currentData.isLive,
    isLoading: isLoading && !data, // Only truly loading if we have no data at all
    isError: isError && !data,
    error: error instanceof Error ? error.message : null,
    fetchedAt: currentData.fetchedAt,
    totalResults: currentData.totalResults,
    refresh,
  };
}
