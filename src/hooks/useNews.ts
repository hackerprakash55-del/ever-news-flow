import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { useCallback } from "react";

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

async function fetchLiveNews(category: string, pageSize: number, location: string) {
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

  // Hard 15s timeout — a stalled NewsAPI / Gemini call must never leave
  // the UI spinning forever. AbortController cancels the request and
  // react-query falls back to mock data via the hook below.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

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
      throw new Error("News feed timed out after 15s");
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

  // Edge function signals graceful upstream failure (e.g. NewsAPI 429)
  // with { fallback: true, articles: [] } and HTTP 200. Treat as error
  // so react-query falls back to mock data via the hook below.
  if (json?.fallback && (!json.articles || json.articles.length === 0)) {
    throw new Error(json.error || "News source temporarily unavailable");
  }

  return {
    articles: (json.articles || []).map(mapToArticle) as Article[],
    isLive: true as const,
    fetchedAt: json.fetchedAt || new Date().toISOString(),
    totalResults: json.totalResults || 0,
  };
}

export function useNews({ category = "all", pageSize = 20, location = "India" }: UseNewsOptions = {}): NewsResult {
  const queryClient = useQueryClient();
  // Every caller shares one request per category+location. Different pageSize
  // values used to create separate cache entries, firing several slow upstream
  // calls per page load.
  const fetchSize = 30;
  const queryKey = ["news", category, location];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchLiveNews(category, fetchSize, location),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0,
    // Keep previous results visible while a refetch is in flight so the
    // feed never blanks out and the page never appears "frozen".
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    refetch();
  }, [queryClient, queryKey, refetch]);

  // Graceful fallback to mock data on error
  if (isError || (!data && !isLoading)) {
    return {
      articles: MOCK_ARTICLES.slice(0, pageSize),
      isLive: false,
      isLoading,
      isError: !isLoading,
      error: error instanceof Error ? error.message : "Failed to load live news",
      fetchedAt: null,
      totalResults: MOCK_ARTICLES.length,
      refresh,
    };
  }

  if (isLoading || !data) {
    return {
      articles: [],
      isLive: false,
      isLoading: true,
      isError: false,
      error: null,
      fetchedAt: null,
      totalResults: 0,
      refresh,
    };
  }

  return {
    articles: (data.articles.length > 0 ? data.articles : MOCK_ARTICLES).slice(0, pageSize),
    isLive: data.isLive,
    isLoading: false,
    isError: false,
    error: null,
    fetchedAt: data.fetchedAt,
    totalResults: data.totalResults,
    refresh,
  };
}
