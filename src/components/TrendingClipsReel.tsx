import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Article } from "@/data/mockData";
import { trackArticleView } from "@/components/SoftSignInPrompt";
import { Play, Pause, ArrowRight, Flame, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORY_GRADIENT: Record<string, string> = {
  AI: "from-violet-900 via-purple-800 to-indigo-900",
  Technology: "from-cyan-900 via-blue-800 to-indigo-900",
  Economy: "from-blue-900 via-teal-800 to-cyan-900",
  Politics: "from-red-900 via-rose-800 to-amber-900",
  Geopolitics: "from-red-900 via-rose-800 to-orange-900",
  Environment: "from-green-900 via-emerald-800 to-teal-900",
  Science: "from-green-900 via-teal-800 to-cyan-900",
  Health: "from-pink-900 via-rose-800 to-red-900",
  "Global Affairs": "from-blue-900 via-indigo-800 to-violet-900",
  General: "from-slate-800 via-slate-700 to-slate-800",
};

const CATEGORY_ICON: Record<string, string> = {
  AI: "🤖", Technology: "💻", Economy: "📈", Politics: "🏛️",
  Environment: "🌿", Science: "🔬", Health: "🏥", "Global Affairs": "🌍",
  Geopolitics: "🌐", General: "📰",
};

const CLIP_MS = 2000;

export function TrendingClipsReel({ articles }: { articles: Article[] }) {
  const navigate = useNavigate();
  const clips = articles.slice(0, 8);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || clips.length === 0) return;
    const start = Date.now();
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / CLIP_MS) * 100);
      setProgress(pct);
      if (elapsed >= CLIP_MS) {
        setActive((a) => (a + 1) % clips.length);
      }
    }, 50);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [active, playing, clips.length]);

  if (clips.length === 0) return null;
  const clip = clips[active];
  const gradient = CATEGORY_GRADIENT[clip.category] || CATEGORY_GRADIENT.General;
  const icon = CATEGORY_ICON[clip.category] || "📰";

  function open(article: Article) {
    try { sessionStorage.setItem(`article-${article.id}`, JSON.stringify(article)); } catch {}
    trackArticleView();
    navigate(`/article/${article.id}`);
  }

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-gainn-red" />
          <span className="text-sm font-semibold">Trending Now</span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-gainn-red px-2 py-0.5 rounded-full border border-gainn-red/30 bg-gainn-red/10">
            <span className="w-1.5 h-1.5 rounded-full bg-gainn-red live-dot" /> LIVE REEL
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActive((a) => (a - 1 + clips.length) % clips.length)}
            className="p-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground"
            aria-label="Previous clip"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="p-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground"
            aria-label={playing ? "Pause reel" : "Play reel"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setActive((a) => (a + 1) % clips.length)}
            className="p-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground"
            aria-label="Next clip"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clip stage */}
      <div
        className={`relative h-48 md:h-56 bg-gradient-to-br ${gradient} cursor-pointer overflow-hidden group`}
        onClick={() => open(clip)}
      >
        {/* Animated decorative motion layers */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.4),transparent_60%)] animate-pulse" />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_linear_infinite]" />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[7rem] opacity-15 select-none transition-transform duration-700 group-hover:scale-110">
          {icon}
        </div>
        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-5 animate-fade-in" key={clip.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/15 text-white backdrop-blur-sm border border-white/20">
              {clip.category.toUpperCase()}
            </span>
            {clip.isBreaking && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-gainn-red text-white">
                BREAKING
              </span>
            )}
            <span className="text-[10px] font-mono text-white/70 ml-auto">
              {active + 1} / {clips.length}
            </span>
          </div>
          <h3 className="text-base md:text-lg font-display text-white leading-snug line-clamp-2 mb-2">
            {clip.headline}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/70">
              {clip.source} · {clip.readTime}m read
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); open(clip); }}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/20 transition-colors"
            >
              See more <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-white transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-thin">
        {clips.map((c, i) => (
          <button
            key={c.id}
            onClick={() => { setActive(i); setProgress(0); }}
            className={`flex-shrink-0 h-1.5 rounded-full transition-all ${
              i === active ? "w-10 bg-gainn-red" : "w-5 bg-border hover:bg-muted-foreground/40"
            }`}
            aria-label={`Go to clip ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}