import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp, ExternalLink, Loader2, Wifi, WifiOff, Filter, CheckCircle, Calendar, Tag, Globe } from "lucide-react";
import { Article, MOCK_ARTICLES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_KEY = "gainn_recent_searches";
const SAVED_SEARCHES_KEY = "gainn_saved_searches";

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(q: string) {
  if (!q.trim()) return;
  const prev = getRecent().filter((s) => s !== q).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
}
function getSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]"); } catch { return []; }
}
function toggleSavedSearch(q: string) {
  const saved = getSaved();
  const exists = saved.includes(q);
  const next = exists ? saved.filter((s) => s !== q) : [q, ...saved].slice(0, 8);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
  return !exists;
}

// Filter types
type DateFilter = "any" | "today" | "week" | "month";
type FilterState = {
  date: DateFilter;
  category: string | null;
  verifiedOnly: boolean;
  source: string | null;
};

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const CATEGORIES = ["Technology", "Politics", "Science", "Economy", "Environment", "AI", "Global Affairs", "Health", "Space"];

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

function applyFilters(articles: Article[], filters: FilterState): Article[] {
  let result = [...articles];

  // Date filter
  if (filters.date !== "any") {
    const now = Date.now();
    const cutoff = filters.date === "today"
      ? now - 86400000
      : filters.date === "week"
      ? now - 7 * 86400000
      : now - 30 * 86400000;
    result = result.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
  }

  // Category filter
  if (filters.category) {
    result = result.filter((a) => a.category === filters.category);
  }

  // Verified only
  if (filters.verifiedOnly) {
    result = result.filter((a) => a.credibilityScore >= 90);
  }

  return result;
}

const DEFAULT_FILTERS: FilterState = { date: "any", category: null, verifiedOnly: false, source: null };

export const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [rawResults, setRawResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = applyFilters(rawResults, filters);
  const hasActiveFilters = filters.date !== "any" || filters.category !== null || filters.verifiedOnly;

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setSavedSearches(getSaved());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setRawResults([]);
      setFilters(DEFAULT_FILTERS);
      setShowFilters(false);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setRawResults([]); setIsSearching(false); return; }
    setIsSearching(true);

    const t = setTimeout(async () => {
      try {
        const live = await fetchLiveSearch(query.trim());
        setRawResults(live);
        setIsLive(true);
      } catch {
        setRawResults(searchMock(query));
        setIsLive(false);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [query]);

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

  function handleToggleSave() {
    if (!query.trim()) return;
    toggleSavedSearch(query.trim());
    setSavedSearches(getSaved());
  }

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (!open) return null;

  const showRecent   = !query && (recent.length > 0 || savedSearches.length > 0);
  const showTrending = !query && recent.length === 0 && savedSearches.length === 0;
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

        {/* Filter toggle */}
        {showResults && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "h-8 flex items-center gap-1.5 px-3 rounded-lg text-sm border transition-colors flex-shrink-0",
              showFilters || hasActiveFilters
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs font-mono">Filters</span>
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {[filters.date !== "any", !!filters.category, filters.verifiedOnly].filter(Boolean).length}
              </span>
            )}
          </button>
        )}

        {/* Save search */}
        {query.trim() && (
          <button
            onClick={handleToggleSave}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg border transition-colors flex-shrink-0",
              savedSearches.includes(query.trim())
                ? "bg-accent/15 border-accent/40 text-accent"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Save search"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter chips row */}
      {showFilters && showResults && (
        <div className="border-b border-border bg-muted/20 px-4 md:px-8 py-3 flex flex-wrap items-center gap-2">
          {/* Date chips */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground mr-1" />
            {DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter("date", opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-colors font-mono",
                  filters.date === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Category chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="w-3 h-3 text-muted-foreground mr-1" />
            <button
              onClick={() => setFilter("category", null)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs border transition-colors font-mono",
                !filters.category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter("category", filters.category === cat ? null : cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-colors font-mono",
                  filters.category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Verified only */}
          <button
            onClick={() => setFilter("verifiedOnly", !filters.verifiedOnly)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors font-mono",
              filters.verifiedOnly
                ? "bg-gainn-green/20 border-gainn-green/40 text-gainn-green"
                : "bg-transparent border-border text-muted-foreground hover:border-gainn-green/40 hover:text-gainn-green"
            )}
          >
            <CheckCircle className="w-3 h-3" /> Verified Only
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="ml-auto text-[11px] font-mono text-primary hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">

        {/* Saved searches + Recent */}
        {showRecent && (
          <div className="space-y-5 mb-6">
            {savedSearches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Saved Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleRecentClick(s)}
                      className="px-3 py-1.5 rounded-full text-sm bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 transition-colors font-mono"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {recent.length > 0 && (
              <section>
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
          </div>
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
            {hasActiveFilters && (
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs mt-2 text-primary hover:text-accent transition-colors">
                Try clearing filters
              </button>
            )}
            <p className="text-xs mt-1 opacity-60">Try a different keyword or topic</p>
          </div>
        )}

        {/* Results */}
        {showResults && !isSearching && results.length > 0 && (
          <section>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
              <span>{results.length} result{results.length !== 1 ? "s" : ""} for "<span className="text-foreground">{query}</span>"
                {rawResults.length !== results.length && <span className="text-muted-foreground/60"> (filtered from {rawResults.length})</span>}
              </span>
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                        {article.category}
                      </span>
                      {article.isBreaking && (
                        <span className="text-[10px] font-mono text-destructive font-bold">BREAKING</span>
                      )}
                      {article.credibilityScore >= 90 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-gainn-green">
                          <CheckCircle className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {article.headline}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{article.summary}</p>
                      <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> {article.region}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {new Date(article.publishedAt).toLocaleDateString()} · {article.readTime}m read · {article.sources[0]}
                    </p>
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
        {query.trim() && (
          <span className="text-accent font-mono text-[10px]">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] mr-1">⌘S</kbd> save search
          </span>
        )}
        <span className="ml-auto opacity-50">Powered by NewsAPI + Gemini</span>
      </div>
    </div>
  );
};
