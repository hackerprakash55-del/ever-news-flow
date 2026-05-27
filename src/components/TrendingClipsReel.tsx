import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Article } from "@/data/mockData";
import { trackArticleView } from "@/components/SoftSignInPrompt";
import { supabase } from "@/integrations/supabase/client";
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
const PULSE_MS = 1500; // realtime tick interval

// Pick N pseudo-random items from a pool, biased toward freshness
function pickClips(pool: Article[], count: number, seed: number): Article[] {
  if (pool.length <= count) return pool.slice(0, count);
  const head = pool.slice(0, Math.min(pool.length, count * 3));
  const out: Article[] = [];
  const used = new Set<number>();
  let s = seed;
  while (out.length < count && used.size < head.length) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % head.length;
    if (!used.has(idx)) { used.add(idx); out.push(head[idx]); }
  }
  return out;
}

export function TrendingClipsReel({ articles }: { articles: Article[] }) {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(0);
  const [isLiveSocket, setIsLiveSocket] = useState(false);
  const clips = useMemo(() => pickClips(articles, 8, pulse + 1), [articles, pulse]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  // ── Realtime WebSocket pulse: refresh clips every 1.5s across all clients ──
  useEffect(() => {
    const channel = supabase
      .channel("trending-clips-pulse", { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "tick" }, (payload) => {
        setPulse((p) => p + 1);
        const seed = (payload?.payload as any)?.seed;
        if (typeof seed === "number") setActive(seed % 8);
      })
      .subscribe((status) => {
        setIsLiveSocket(status === "SUBSCRIBED");
      });

    // Self-broadcast tick to keep the reel live without forcing constant React work.
    const iv = window.setInterval(() => {
      const seed = Math.floor(Math.random() * 1000);
      channel.send({ type: "broadcast", event: "tick", payload: { seed, ts: Date.now() } });
    }, PULSE_MS * 2);

    return () => {
      window.clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!playing || clips.length === 0) return;
    const timer = window.setTimeout(() => {
      setActive((a) => (a + 1) % clips.length);
    }, CLIP_MS);
    return () => window.clearTimeout(timer);
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

  function openCategory(category: string) {
    navigate(`/trending?category=${encodeURIComponent(category)}`);
  }

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-gainn-red" />
          <span className="text-sm font-semibold">Trending Now</span>
          <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isLiveSocket
              ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10"
              : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full live-dot ${isLiveSocket ? "bg-gainn-green" : "bg-gainn-amber"}`} />
            {isLiveSocket ? "LIVE · WS" : "CONNECTING…"}
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
              {clip.sources?.[0] ?? "GAINN"} · {clip.readTime}m read
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openCategory(clip.category); }}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/20 transition-colors"
            >
              See more in {clip.category} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            key={`${clip.id}-${active}-${playing ? "playing" : "paused"}`}
            className={`h-full bg-white ${playing ? "clip-progress" : "w-0"}`}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-thin">
        {clips.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActive(i)}
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