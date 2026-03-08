import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp, ExternalLink, Loader2, Wifi, WifiOff } from "lucide-react";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_KEY = "gainn_recent_searches";

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(q: string) {
  if (!q.trim()) return;
  const prev = getRecent().filter((s) => s !== q).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
}

// Calls the fetch-news edge function with a keyword query
async function fetchLiveSearch(query: string): Promise<Article[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) throw new Error("Missing env vars");

  const params = new URLSearchParams({ q: query, pageSize: "10" });
  const res = await fetch(`${supabaseUrl}/functions/v1/fetch-news?${params}`, {
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  // Map raw response to Article shape (edge fn already does this, but let's be safe)
  return (json.articles || []).map((a: any): Article => ({
    id: a.id || `search-${Date.now()}-${Math.random()}`,
    headline: a.headline || a.title || "Untitled",
    summary: a.summary || a.description || "",
    body: a.body || a.content || "",
    category: a.category || "Global Affairs",
    credibilityScore: a.credibilityScore ?? 85,
    sources: Array.isArray(a.sources) ? a.sources : [a.sources || "NewsAPI"],
    publishedAt: a.publishedAt || new Date().toISOString(),
    readTime: a.readTime ?? 3,
    tags: Array.isArray(a.tags) ? a.tags : [],
    isBreaking: Boolean(a.isBreaking),
    region: a.region || "Global",
    imageUrl: a.imageUrl || undefined,
    aiGenerated: Boolean(a.aiGenerated),
    biasScore: typeof a.biasScore === "number" ? a.biasScore : 0,
  }));
}

// Client-side fallback: filter mock articles
function searchMock(query: string): Article[] {
  const q = query.toLowerCase();
  return MOCK_ARTICLES.filter(
    (a) =>
      a.headline.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  ).slice(0, 8);
}

export const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus + reset on open/close
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);

    const t = setTimeout(async () => {
      try {
        const live = await fetchLiveSearch(query.trim());
        setResults(live);
        setIsLive(true);
      } catch {
        // Graceful fallback to mock data
        setResults(searchMock(query));
        setIsLive(false);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce — longer than mock so we don't hammer the API

    return () => clearTimeout(t);
  }, [query]);

  // Escape to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  function handleSelect(article: Article) {
    saveRecent(query);
    setRecent(getRecent());
    onClose();
    navigate(`/article/${article.id}`);
  }

  function handleRecentClick(q: string) {
    setQuery(q);
    inputRef.current?.focus();
  }

  if (!open) return null;

  const showRecent   = !query && recent.length > 0;
  const showTrending = !query && recent.length === 0;
  const showResults  = !!query;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "hsla(var(--background) / 0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* Search input bar */}
      <div className="border-b border-border px-4 md:px-8 py-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-primary flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search live news — topics, keywords, categories…"
          className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none font-medium"
        />
        {isSearching && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />}
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">

        {/* Recent searches */}
        {showRecent && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Recent</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRecentClick(r)}
                  className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Trending topics */}
        {showTrending && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Trending Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["AI", "Technology", "Climate", "Economy", "Politics", "Science", "Space", "Geopolitics"].map((t) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="px-3 py-1.5 rounded-full text-sm border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-mono"
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Searching skeleton */}
        {showResults && isSearching && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* No results */}
        {showResults && !isSearching && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No results for <span className="text-foreground font-semibold">"{query}"</span></p>
            <p className="text-xs mt-1 opacity-60">Try a different keyword or topic</p>
          </div>
        )}

        {/* Results */}
        {showResults && !isSearching && results.length > 0 && (
          <section>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
              <span>{results.length} result{results.length !== 1 ? "s" : ""} for "<span className="text-foreground">{query}</span>"</span>
              <span className="ml-auto flex items-center gap-1">
                {isLive
                  ? <><Wifi className="w-3 h-3 text-accent" /><span className="text-accent">Live</span></>
                  : <><WifiOff className="w-3 h-3 text-muted-foreground" /><span>Demo</span></>
                }
              </span>
            </div>
            <div className="space-y-2">
              {results.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelect(article)}
                  className="w-full text-left flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                        {article.category}
                      </span>
                      {article.isBreaking && (
                        <span className="text-[10px] font-mono text-destructive font-bold">BREAKING</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {article.headline}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{article.summary}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-border px-4 py-2 text-xs font-mono text-muted-foreground flex items-center gap-4">
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">ESC</kbd> to close</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">↵</kbd> to open article</span>
        <span className="ml-auto opacity-50">Powered by NewsAPI + Gemini</span>
      </div>
    </div>
  );
};
