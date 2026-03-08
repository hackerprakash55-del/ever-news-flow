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

async function fetchLiveNews(category: string, pageSize: number) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase env vars missing");
  }

  const params = new URLSearchParams({
    category: category || "all",
    pageSize: String(pageSize),
  });

  const response = await fetch(
    `${supabaseUrl}/functions/v1/fetch-news?${params}`,
    {
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP ${response.status}`);
  }

  const json = await response.json();

  return {
    articles: (json.articles || []).map(mapToArticle) as Article[],
    isLive: true as const,
    fetchedAt: json.fetchedAt || new Date().toISOString(),
    totalResults: json.totalResults || 0,
  };
}

export function useNews({ category = "all", pageSize = 20 }: UseNewsOptions = {}): NewsResult {
  const queryClient = useQueryClient();
  const queryKey = ["news", category, pageSize];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchLiveNews(category, pageSize),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,       // silent background refresh every 5 min
    refetchIntervalInBackground: false,     // pause when tab is hidden
    retry: 1,
    retryDelay: 2000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    refetch();
  }, [queryClient, queryKey, refetch]);

  // Graceful fallback to mock data on error
  if (isError || (!data && !isLoading)) {
    return {
      articles: MOCK_ARTICLES,
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
    articles: data.articles.length > 0 ? data.articles : MOCK_ARTICLES,
    isLive: data.isLive,
    isLoading: false,
    isError: false,
    error: null,
    fetchedAt: data.fetchedAt,
    totalResults: data.totalResults,
    refresh,
  };
}
