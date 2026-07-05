import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNews } from "@/hooks/useNews";
import { fetchNarration, releaseNarration } from "@/lib/tts";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, ExternalLink, ShieldCheck, Share2, Bookmark, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "@/data/mockData";

const GRADIENTS = [
  "from-cyan-500/40 via-blue-600/30 to-purple-700/40",
  "from-red-500/40 via-orange-500/30 to-pink-600/40",
  "from-emerald-500/40 via-teal-600/30 to-cyan-700/40",
  "from-fuchsia-500/40 via-purple-600/30 to-indigo-700/40",
  "from-amber-500/40 via-red-500/30 to-rose-700/40",
  "from-sky-500/40 via-indigo-600/30 to-violet-700/40",
];

function scriptFor(a: Article) {
  const lead = a.summary || a.body?.slice(0, 240) || a.headline;
  return `${a.headline}. ${lead}`.replace(/\s+/g, " ").trim().slice(0, 480);
}

function captionFor(a: Article) {
  return `${a.headline} — Read the full story & more at gainn.com  #GAINN #AINews #India #Breaking ${a.category ? "#" + a.category.replace(/\s+/g, "") : ""}`;
}

export default function ShortsPage() {
  // Continuous India-first live news; 20 articles; auto-refresh every 5 min
  const { articles, isLoading, refresh } = useNews({ pageSize: 20, location: "India" });
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [premium, setPremium] = useState<"idle" | "loading" | "playing" | "browser">("idle");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(0);

  useEffect(() => { activeRef.current = active; }, [active]);

  // Background refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(() => refresh(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [refresh]);

  const stopAll = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    releaseNarration(audioUrlRef.current);
    audioUrlRef.current = null;
    uttRef.current = null;
  }, []);

  const advance = useCallback(() => {
    const next = activeRef.current + 1;
    const el = cardsRef.current[next];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const speakBrowser = useCallback(async (a: Article) => {
    setPremium("browser");
    await waitForVoices();
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(scriptFor(a));
    tuneUtterance(u);
    u.onend = () => { if (activeRef.current === active) advance(); };
    uttRef.current = u;
    if (!muted && !paused) window.speechSynthesis.speak(u);
  }, [active, advance, muted, paused]);

  const speakPremium = useCallback(async (a: Article) => {
    setPremium("loading");
    const idx = activeRef.current;
    const { audioUrl } = await fetchNarration(scriptFor(a), a.headline);
    if (idx !== activeRef.current) return;
    if (!audioUrl) { await speakBrowser(a); return; }
    audioUrlRef.current = audioUrl;
    const audio = new Audio(audioUrl);
    audio.muted = muted;
    audioRef.current = audio;
    audio.onended = () => { if (activeRef.current === idx) advance(); };
    audio.onerror = () => { speakBrowser(a); };
    setPremium("playing");
    if (!paused) audio.play().catch(() => speakBrowser(a));
  }, [advance, muted, paused, speakBrowser]);

  // Play narration whenever active card changes
  useEffect(() => {
    stopAll();
    const a = articles[active];
    if (!a || paused) return;
    speakPremium(a);
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, articles.length]);

  // Mute/pause reactivity
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    if (muted) { try { window.speechSynthesis?.pause(); } catch {} }
    else { try { window.speechSynthesis?.resume(); } catch {} }
  }, [muted]);

  useEffect(() => {
    if (paused) {
      audioRef.current?.pause();
      try { window.speechSynthesis?.pause(); } catch {}
    } else {
      audioRef.current?.play().catch(() => {});
      try { window.speechSynthesis?.resume(); } catch {}
    }
  }, [paused]);

  // Intersection observer for snap → active card
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) {
          const idx = Number((top.target as HTMLElement).dataset.idx);
          if (!Number.isNaN(idx) && idx !== activeRef.current) setActive(idx);
        }
      },
      { root, threshold: [0.55, 0.75, 0.95] }
    );
    cardsRef.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [articles.length]);

  const share = async (a: Article) => {
    const text = captionFor(a);
    const url = `${window.location.origin}/article/${a.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: a.headline, text, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        title="GAINN Shorts — AI News Reels, India Live"
        description="Vertical AI-narrated news shorts. India-first, continuously updated. Swipe to explore breaking stories back-to-back."
      />
      <GlobalHeader />

      <main className="relative">
        {/* Top HUD */}
        <div className="sticky top-14 z-30 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-background/95 via-background/70 to-transparent backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-red-400">Shorts · India Live</span>
            <span className="text-[10px] text-muted-foreground ml-2">{articles.length} stories · auto-refresh 5m</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMuted(m => !m)} className="p-2 rounded-full hover:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setPaused(p => !p)} className="p-2 rounded-full hover:bg-white/10" aria-label={paused ? "Play" : "Pause"}>
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="h-[calc(100vh-104px)] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        >
          {isLoading && articles.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="flex items-center gap-3"><Radio className="w-5 h-5 animate-pulse" /> Preparing India Shorts…</div>
            </div>
          )}

          {articles.map((a, i) => {
            const grad = GRADIENTS[i % GRADIENTS.length];
            const isActive = i === active;
            return (
              <section
                key={a.id + i}
                data-idx={i}
                ref={el => (cardsRef.current[i] = el)}
                className="snap-start h-[calc(100vh-104px)] w-full relative overflow-hidden"
              >
                {/* Background gradient / image */}
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt="" loading="lazy"
                    className={cn("absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms]",
                      isActive ? "scale-110" : "scale-100")}
                  />
                ) : null}
                <div className={cn("absolute inset-0 bg-gradient-to-br", grad)} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/90" />

                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
                  <div className={cn("h-full bg-cyan-400 transition-all", isActive && !paused ? "w-full duration-[20000ms]" : "w-0 duration-200")} />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-8 pt-16 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    {a.isBreaking && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wider">BREAKING</span>}
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-semibold">{a.category}</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300"><ShieldCheck className="w-3 h-3" />{a.credibilityScore}%</span>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl leading-tight font-bold text-white drop-shadow-lg">
                    {a.headline}
                  </h1>
                  <p className="mt-3 text-sm md:text-base text-white/85 line-clamp-4">
                    {a.summary || a.body?.slice(0, 220)}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
                    <span>Source: {Array.isArray(a.sources) ? a.sources[0] : a.sources}</span>
                    <span>·</span>
                    <span>{a.readTime || 2} min read</span>
                    {premium === "playing" && isActive && <span className="ml-auto text-cyan-300">🎙️ Premium AI Voice</span>}
                    {premium === "browser" && isActive && <span className="ml-auto text-white/50">🔊 Browser Voice</span>}
                    {premium === "loading" && isActive && <span className="ml-auto text-white/50">Loading voice…</span>}
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      to={`/article/${a.id}`}
                      state={{ article: a }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition"
                    >
                      Read Full Story <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button onClick={() => share(a)} className="p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white" aria-label="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white" aria-label="Save">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Side rail counter */}
                <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-1.5">
                  {articles.slice(0, Math.min(articles.length, 20)).map((_, k) => (
                    <span key={k} className={cn("w-1 rounded-full transition-all", k === i ? "h-6 bg-cyan-400" : "h-2 bg-white/25")} />
                  ))}
                </div>
              </section>
            );
          })}

          {articles.length > 0 && (
            <div className="snap-start h-40 flex items-center justify-center text-xs text-muted-foreground">
              You're all caught up · new stories load automatically every 5 minutes
            </div>
          )}
        </div>

        {/* Bottom nav hint */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/40 text-[10px] pointer-events-none">
          <ChevronUp className="w-3 h-3" />
          Swipe
          <ChevronDown className="w-3 h-3" />
        </div>
      </main>
    </div>
  );
}
