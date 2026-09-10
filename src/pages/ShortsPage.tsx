import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNews } from "@/hooks/useNews";
import { fetchNarration, releaseNarration } from "@/lib/tts";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { getLanguage } from "@/lib/language";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, ExternalLink, ShieldCheck, Share2, Bookmark, Radio, Heart, Download, Sparkles, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "@/data/mockData";
import { toast } from "sonner";

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

/** Renders a 1080x1920 share card for the story and triggers a PNG download. */
function downloadCard(a: Article) {
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#06222e");
  g.addColorStop(0.5, "#060910");
  g.addColorStop(1, "#1a0a12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#00D4FF";
  ctx.font = "bold 44px Inter, sans-serif";
  ctx.fillText("GAINN", 80, 160);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "28px monospace";
  ctx.fillText((a.category || "NEWS").toUpperCase(), 80, 215);

  // Headline wrapping
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px Georgia, serif";
  const words = a.headline.split(" ");
  let line = "", y = 900;
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W - 160 && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  y = 900 - Math.min(lines.length, 8) * 45;
  lines.slice(0, 8).forEach((l) => { ctx.fillText(l, 80, y); y += 92; });

  const summary = (a.summary || a.body || "").slice(0, 240);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "36px Inter, sans-serif";
  let sline = "", sy = y + 40;
  for (const w of summary.split(" ")) {
    const test = sline ? `${sline} ${w}` : w;
    if (ctx.measureText(test).width > W - 160 && sline) { ctx.fillText(sline, 80, sy); sy += 52; sline = w; }
    else sline = test;
  }
  if (sline) ctx.fillText(sline, 80, sy);

  ctx.fillStyle = "#00D4FF";
  ctx.font = "30px monospace";
  ctx.fillText(`${a.credibilityScore}% TRUST · AI VERIFIED · gainn.com`, 80, H - 120);

  const link = document.createElement("a");
  link.download = `gainn-${a.id}.png`;
  link.href = c.toDataURL("image/png");
  link.click();
}

export default function ShortsPage() {
  // Continuous India-first live news; 20 articles; auto-refresh every 5 min
  const { articles, isLoading, refresh } = useNews({ pageSize: 20, location: "India" });
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [premium, setPremium] = useState<"idle" | "loading" | "playing" | "browser">("idle");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
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
    try { window.speechSynthesis.cancel(); window.speechSynthesis.resume(); } catch {}
    const u = new SpeechSynthesisUtterance(scriptFor(a));
    tuneUtterance(u, getLanguage());
    u.onend = () => { if (activeRef.current === active) advance(); };
    uttRef.current = u;
    if (!muted && !paused) window.speechSynthesis.speak(u);
  }, [active, advance, muted, paused]);

  const speakPremium = useCallback(async (a: Article) => {
    setPremium("loading");
    const idx = activeRef.current;
    const { audioUrl } = await fetchNarration(scriptFor(a), a.headline, getLanguage());
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

  // Browsers block speech until the user interacts with the page — retry the
  // current story's narration on the first gesture.
  useEffect(() => {
    const unlock = () => {
      try { window.speechSynthesis?.resume(); } catch {}
      const a = articles[activeRef.current];
      if (a && !paused && !muted && !window.speechSynthesis?.speaking && !audioRef.current) {
        speakBrowser(a);
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [articles, paused, muted, speakBrowser]);

  // Chrome silently stops long utterances after ~15s without a resume tick.
  useEffect(() => {
    const t = setInterval(() => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused && !muted && !paused) {
        try { window.speechSynthesis.resume(); } catch {}
      }
    }, 8000);
    return () => clearInterval(t);
  }, [muted, paused]);

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
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const shareToX = (a: Article) => {
    const url = `${window.location.origin}/article/${a.id}`;
    const text = `${a.headline}\n\n✓ AI Verified — GAINN`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=GAINN,AINews`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const toggleLike = (a: Article) => {
    setLiked(p => {
      const next = { ...p, [a.id]: !p[a.id] };
      toast.success(next[a.id] ? "Added to your likes" : "Like removed");
      return next;
    });
  };

  const toggleSave = (a: Article) => {
    setSaved(p => {
      const next = { ...p, [a.id]: !p[a.id] };
      toast.success(next[a.id] ? "Saved to your reading list" : "Removed from saved");
      return next;
    });
  };

  const handleDownload = (a: Article) => {
    try { downloadCard(a); toast.success("Story card downloaded"); }
    catch { toast.error("Couldn't create the story card"); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        path="/shorts"
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
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/25 text-white text-[10px] font-bold tracking-wider">
                      <Sparkles className="w-3 h-3" />AI
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-semibold">{a.category}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300"><ShieldCheck className="w-3 h-3" />{a.credibilityScore}% TRUST</span>
                    <span className="px-2 py-0.5 rounded-full border border-white/20 text-white/70 text-[10px] font-mono">
                      {a.isBreaking ? "TRENDING" : "RECENT"}
                    </span>
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
                    <button
                      onClick={() => toggleSave(a)}
                      aria-pressed={!!saved[a.id]}
                      className={cn("p-3 rounded-full border border-white/20 hover:bg-white/20 text-white transition",
                        saved[a.id] ? "bg-cyan-400/25 border-cyan-300/50 text-cyan-200" : "bg-white/10")}
                      aria-label={saved[a.id] ? "Remove from saved" : "Save"}
                    >
                      <Bookmark className={cn("w-4 h-4", saved[a.id] && "fill-current")} />
                    </button>
                  </div>
                </div>

                {/* Action rail */}
                <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
                  <button
                    onClick={() => toggleLike(a)}
                    aria-pressed={!!liked[a.id]}
                    aria-label={liked[a.id] ? "Unlike" : "Like"}
                    className={cn("flex flex-col items-center transition active:scale-90",
                      liked[a.id] ? "text-red-500" : "text-white/85 hover:text-red-400")}
                  >
                    <Heart className={cn("w-6 h-6", liked[a.id] && "fill-current")} />
                    <span className="text-[10px] font-mono">
                      {(a.headline.length * 7) % 900 + 42 + (liked[a.id] ? 1 : 0)}
                    </span>
                  </button>
                  <button aria-label="Share" onClick={() => share(a)} className="flex flex-col items-center text-white/85 hover:text-cyan-300 transition">
                    <Share2 className="w-6 h-6" />
                    <span className="text-[10px] font-mono">{(a.headline.length * 3) % 300 + 11}</span>
                  </button>
                  <button aria-label="Post on X" onClick={() => shareToX(a)} className="flex flex-col items-center text-white/85 hover:text-cyan-300 transition active:scale-90">
                    <Twitter className="w-6 h-6" />
                    <span className="text-[10px] font-mono">Post</span>
                  </button>
                  <button
                    onClick={() => handleDownload(a)}
                    aria-label="Download story card"
                    className="flex flex-col items-center text-white/85 hover:text-cyan-300 transition active:scale-90"
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-[10px] font-mono">Save</span>
                  </button>
                </div>

                {/* Side rail counter */}
                <div className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 flex-col gap-1.5">
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
