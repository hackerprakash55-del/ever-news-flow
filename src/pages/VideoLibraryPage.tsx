import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import {
  Search, Film, Clock, Tag, ChevronRight, Play,
  BookOpen, Zap, RefreshCw, Library, Radio, Eye, X, Maximize2, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface VideoRecord {
  id: string;
  title: string;
  category: string | null;
  duration: string | null;
  script: string;
  thumbnail_prompt: string | null;
  thumbnail_url: string | null;
  raw_headlines: string[] | null;
  generated_at: string | null;
  created_at: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  "All",
  "AI",
  "Technology",
  "Economy",
  "Politics",
  "Science",
  "Environment",
  "Health",
  "Global Affairs",
];

const CATEGORY_COLORS: Record<string, string> = {
  AI:             "bg-gainn-purple/20 text-gainn-purple border-gainn-purple/30",
  Technology:     "bg-gainn-blue/20 text-gainn-blue border-gainn-blue/30",
  Economy:        "bg-gainn-green/20 text-gainn-green border-gainn-green/30",
  Politics:       "bg-gainn-red/20 text-gainn-red border-gainn-red/30",
  Environment:    "bg-gainn-green/20 text-gainn-green border-gainn-green/30",
  Science:        "bg-gainn-cyan/20 text-gainn-cyan border-gainn-cyan/30",
  Health:         "bg-gainn-amber/20 text-gainn-amber border-gainn-amber/30",
  "Global Affairs":"bg-gainn-blue/20 text-gainn-blue border-gainn-blue/30",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  AI:             "from-gainn-purple/25 to-gainn-blue/5",
  Technology:     "from-gainn-blue/25 to-gainn-cyan/5",
  Economy:        "from-gainn-green/25 to-gainn-cyan/5",
  Politics:       "from-gainn-red/25 to-gainn-amber/5",
  Environment:    "from-gainn-green/25 to-gainn-blue/5",
  Science:        "from-gainn-cyan/25 to-gainn-blue/5",
  Health:         "from-gainn-amber/25 to-gainn-green/5",
  "Global Affairs":"from-gainn-blue/25 to-gainn-purple/5",
};

const CATEGORY_ICONS: Record<string, string> = {
  AI: "🤖", Technology: "💻", Economy: "📈", Politics: "🏛️",
  Environment: "🌿", Science: "🚀", Health: "🏥", "Global Affairs": "🌍",
};

// ── Data fetching ─────────────────────────────────────────────────────────

async function fetchVideos(): Promise<VideoRecord[]> {
  const { data, error } = await supabase
    .from("generated_videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VideoRecord[];
}

// ── Sub-components ────────────────────────────────────────────────────────

function VideoCard({ video }: { video: VideoRecord }) {
  const cat = video.category ?? "Global Affairs";
  const gradient = CATEGORY_GRADIENTS[cat] ?? "from-gainn-blue/20 to-gainn-purple/5";
  const badge = CATEGORY_COLORS[cat] ?? "bg-surface-2 text-muted-foreground border-border";
  const icon = CATEGORY_ICONS[cat] ?? "📰";
  const headlines: string[] = Array.isArray(video.raw_headlines)
    ? video.raw_headlines.slice(0, 3)
    : [];
  const wordCount = (video.script ?? "").split(/\s+/).length;
  const readMins = Math.max(1, Math.round(wordCount / 150));
  const createdAt = video.created_at
    ? new Date(video.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <Link
      to="/video"
      state={{ videoId: video.id }}
      className="group block card-glass rounded-xl overflow-hidden hover:border-gainn-blue/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gainn-blue/10"
    >
      {/* Thumbnail area */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(hsl(var(--gainn-blue)) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            <div className="relative flex flex-col items-center gap-3 text-center px-4">
              <span className="text-4xl">{icon}</span>
              <div className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-gainn-blue/30 transition-colors">
                <Play className="w-5 h-5 text-foreground/80 group-hover:text-gainn-cyan transition-colors ml-0.5" />
              </div>
            </div>
          </>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white">
            {video.duration}
          </div>
        )}

        {/* Category badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${badge}`}>
          {cat}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-gainn-cyan transition-colors">
          {video.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {readMins} min
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {wordCount.toLocaleString()} words
          </span>
          <span className="ml-auto">{createdAt}</span>
        </div>

        {/* Sample headlines */}
        {headlines.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            {headlines.map((h, i) => (
              <p key={i} className="text-[11px] text-muted-foreground line-clamp-1 flex items-start gap-1">
                <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-gainn-blue/60" />
                {h}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gainn-blue group-hover:text-gainn-cyan transition-colors">
          <Play className="w-3 h-3" /> Watch Report
          <ChevronRight className="w-3 h-3 ml-auto" />
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card-glass rounded-xl overflow-hidden animate-pulse">
      <div className="h-44 bg-surface-2" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-2 rounded w-3/4" />
        <div className="h-3 bg-surface-2 rounded w-1/2" />
        <div className="space-y-1.5 pt-2 border-t border-border/40">
          <div className="h-3 bg-surface-2 rounded" />
          <div className="h-3 bg-surface-2 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function VideoLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: videos = [], isLoading, isError, refetch, isFetching } = useQuery<VideoRecord[]>({
    queryKey: ["video-library"],
    queryFn: fetchVideos,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let result = videos;
    if (activeCategory !== "All") {
      result = result.filter((v) => (v.category ?? "Global Affairs") === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.category ?? "").toLowerCase().includes(q) ||
          (Array.isArray(v.raw_headlines)
            ? v.raw_headlines.some((h) => h.toLowerCase().includes(q))
            : false)
      );
    }
    return result;
  }, [videos, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: videos.length };
    for (const v of videos) {
      const cat = v.category ?? "Global Affairs";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [videos]);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <NewsTickerBar />

      {/* ── Hero header ── */}
      <div className="border-b border-border bg-surface-1">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gainn-purple/20 border border-gainn-purple/30 flex items-center justify-center">
                  <Film className="w-4 h-4 text-gainn-purple" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-gainn-green">
                  <div className="w-1.5 h-1.5 rounded-full bg-gainn-green animate-pulse" />
                  AI Video Library
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-display text-foreground">
                Generated News Reports
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {videos.length} AI-authored video scripts covering global events
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/video">
                <Button size="sm" className="gap-2 bg-gainn-purple hover:bg-gainn-purple/90 text-white">
                  <Zap className="w-3.5 h-3.5" />
                  Generate New Report
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="relative mt-5 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title, topic, or headline…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gainn-blue/40 focus:border-gainn-blue/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category filter tabs ── */}
      <div className="border-b border-border bg-surface-1/80 sticky top-[var(--header-height,112px)] z-30 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {ALL_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isActive
                      ? "bg-gainn-blue/20 text-gainn-cyan border-gainn-blue/40"
                      : "text-muted-foreground border-transparent hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {cat !== "All" && <span>{CATEGORY_ICONS[cat]}</span>}
                  {cat}
                  <span className={`text-[10px] font-mono px-1 rounded ${isActive ? "bg-gainn-blue/30 text-gainn-cyan" : "bg-surface-2 text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
        {isError && (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">⚠️</div>
            <p className="text-muted-foreground text-sm">Failed to load video library.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto">
              <Library className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {search || activeCategory !== "All" ? "No matching reports" : "No reports yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {search || activeCategory !== "All"
                ? "Try a different search term or category filter."
                : "Generate your first AI news report to see it here."}
            </p>
            {!search && activeCategory === "All" && (
              <Link to="/video">
                <Button size="sm" className="gap-2 bg-gainn-purple hover:bg-gainn-purple/90 text-white mt-2">
                  <Zap className="w-3.5 h-3.5" /> Generate First Report
                </Button>
              </Link>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            {/* Results summary */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-muted-foreground font-mono">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> reports
                {activeCategory !== "All" && <> in <span className="text-gainn-cyan">{activeCategory}</span></>}
                {search && <> matching "<span className="text-gainn-cyan">{search}</span>"</>}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-gainn-green font-mono">
                <Radio className="w-3 h-3 animate-live-pulse" />
                Live library
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
