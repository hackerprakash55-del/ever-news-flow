import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { useCallback } from "react";

// Map raw NewsAPI response shape to our Article type
function mapToArticle(raw: any): Article {
  return {
    id: raw.id || `live-${Date.now()}`,
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

export function useNews({ category = "all", pageSize = 20 }: UseNewsOptions = {}): NewsResult {
  const queryClient = useQueryClient();

  const queryKey = ["news", category, pageSize];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-news", {
        body: null,
        // Pass as query params via the headers trick — use GET method
      });

      // supabase.functions.invoke only supports POST, so we use fetch directly
      throw new Error("use-fetch"); // force fallback to fetch
    },
    // We override the queryFn via initialData trick — use a proper fetch
    enabled: false, // disabled — we handle manually below
  });

  const {
    data: liveData,
    isLoading: loading,
    isError: hasError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ articles: Article[]; isLive: boolean; fetchedAt: string; totalResults: number }> => {
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

      const articles = (json.articles || []).map(mapToArticle);
      return {
        articles,
        isLive: true,
        fetchedAt: json.fetchedAt || new Date().toISOString(),
        totalResults: json.totalResults || articles.length,
      };
    },
    staleTime: 5 * 60 * 1000,    // 5 min cache
    retry: 1,
    retryDelay: 2000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    refetch();
  }, [queryClient, queryKey, refetch]);

  // On error: gracefully fall back to mock data
  if (hasError || !liveData) {
    const errorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
    const useMock = !loading; // while loading show loading state

    return {
      articles: useMock ? MOCK_ARTICLES : [],
      isLive: false,
      isLoading: loading,
      isError: hasError && !loading,
      error: hasError ? errorMsg : null,
      fetchedAt: null,
      totalResults: MOCK_ARTICLES.length,
      refresh,
    };
  }

  return {
    articles: liveData.articles.length > 0 ? liveData.articles : MOCK_ARTICLES,
    isLive: liveData.isLive,
    isLoading: loading,
    isError: false,
    error: null,
    fetchedAt: liveData.fetchedAt,
    totalResults: liveData.totalResults,
    refresh,
  };
}
