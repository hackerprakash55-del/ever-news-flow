import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp, ExternalLink, Loader2 } from "lucide-react";
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
  const prev = getRecent().filter((s) => s !== q).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
}

export const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const t = setTimeout(() => {
      const q = query.toLowerCase();
      const found = MOCK_ARTICLES.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.toLowerCase().includes(q))
      ).slice(0, 8);
      setResults(found);
      setIsSearching(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  // Escape to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  function handleSelect(article: Article) {
    saveRecent(query || article.headline);
    setRecent(getRecent());
    onClose();
    navigate(`/article/${article.id}`);
  }

  function handleRecentClick(q: string) {
    setQuery(q);
    inputRef.current?.focus();
  }

  if (!open) return null;

  const showRecent = !query && recent.length > 0;
  const showTrending = !query && recent.length === 0;
  const showResults = !!query;

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
          placeholder="Search articles, topics, categories…"
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

        {/* Search results */}
        {showResults && !isSearching && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No results for <span className="text-foreground font-semibold">"{query}"</span></p>
            <p className="text-xs mt-1 opacity-60">Try a different keyword or topic</p>
          </div>
        )}

        {showResults && results.length > 0 && (
          <section>
            <div className="text-xs font-mono text-muted-foreground mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""} for "<span className="text-foreground">{query}</span>"
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
      </div>
    </div>
  );
};
