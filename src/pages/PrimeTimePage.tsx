import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play, Pause, SkipForward, Volume2, VolumeX, ArrowRight, ShieldCheck,
  MessageSquare, AudioLines, Star, Users, Radio,
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { NewsletterBanner } from "@/components/NewsletterBanner";
import { useNews } from "@/hooks/useNews";
import { fetchNarration, releaseNarration } from "@/lib/tts";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { cn } from "@/lib/utils";
import type { Article } from "@/data/mockData";

const FALLBACK =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=80";

/* ── Story grid card ── */
function StoryCard({ a }: { a: Article }) {
  return (
    <Link
      to={`/article/${a.id}`}
      state={{ article: a }}
      className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-white/10 h-64 hover-lift"
    >
      <img src={a.imageUrl || FALLBACK} alt={a.headline} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-black/40" />

      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 border border-white/20 text-[9px] font-mono font-bold tracking-widest text-white uppercase">
        {a.category}
      </span>
      <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 text-[9px] font-mono font-bold text-primary uppercase">
        <ShieldCheck className="w-3 h-3" /> AI Verified
      </span>

      <div className="relative z-10 p-4">
        <h3 className="font-display font-bold text-base leading-snug text-white line-clamp-3">
          {a.headline}
        </h3>
        <div className="mt-2 text-[10px] font-mono text-white/60 truncate">
          GAINN AI Desk · {Array.isArray(a.sources) ? a.sources[0] : a.sources} · {a.readTime || 3} min read
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-mono text-white/60">
            <MessageSquare className="w-3 h-3" /> {(a.headline.length * 3) % 180 + 12}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-primary/50 text-[10px] font-mono text-primary">
            {a.credibilityScore}% Trust
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PrimeTimePage() {
  const { articles, isLive } = useNews({ pageSize: 20, location: "India" });
  const [activeStory, setActiveStory] = useState(0);
  const [gridCount, setGridCount] = useState(6);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const tonight = useMemo(() => articles.slice(0, 6), [articles]);
  const feature = tonight[activeStory] ?? tonight[0];
  const tickerTopics = articles.slice(0, 8).map((a) => a.headline.split(" ").slice(0, 4).join(" "));

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        path="/prime-time"
        title="Prime Time — GAINN's Nightly AI-Narrated News Show"
        description="GAINN Prime Time: a nightly AI-narrated news broadcast with cinematic deep-dives, real photojournalism and AI-verified reporting. Real stories, real images, real insights."
      />
      <div className="ambient-orbs" aria-hidden="true"><span /></div>
      <GlobalHeader />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-8 space-y-12">
        {/* ── Masthead ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-gainn-red/50 text-[10px] font-mono font-bold tracking-widest text-gainn-red uppercase">
                <span className="w-2 h-2 rounded-full bg-gainn-red live-dot" /> Live every night · 9PM ET
              </span>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                GAINN Flagship Show
              </span>
            </div>

            <h1 className="mt-5 font-display font-bold leading-none text-[52px] md:text-[76px] text-white [text-shadow:0_0_36px_hsl(var(--primary)/0.45)]">
              Prime <span className="text-primary">Time</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
              GAINN's nightly flagship show. AI-narrated cinematic deep-dives on every major story,
              with live visuals, real photojournalism and professional broadcast quality — no anchors,
              no bias, fully AI-verified. Real stories, real images, real insights.
            </p>

            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card-glass rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <Users className="w-3 h-3" /> Nightly viewers
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-white">2.4M</div>
              </div>
              <div className="card-glass rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <Star className="w-3 h-3" /> Viewer rating
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-white">4.9★</div>
              </div>
              <div className="card-glass rounded-lg px-4 py-3 border-gainn-red/30">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gainn-red uppercase tracking-widest">
                  <Radio className="w-3 h-3" /> Live
                </div>
                <div className="mt-1 text-xs font-mono text-white">every night 9PM ET</div>
              </div>
            </div>

            {/* Tonight's Stories carousel */}
            <div className="mt-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Tonight's Stories
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {tonight.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setActiveStory(i)}
                    className={cn(
                      "flex-shrink-0 max-w-[260px] px-4 py-2 rounded-full border text-xs font-medium truncate transition",
                      i === activeStory
                        ? "bg-primary/15 border-primary/60 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                    )}
                  >
                    {a.headline}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                {tonight.map((_, i) => (
                  <span key={i} className={cn("h-1 rounded-full transition-all",
                    i === activeStory ? "w-6 bg-primary" : "w-2 bg-border")} />
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex items-center gap-3 flex-wrap">
              <Link
                to={feature ? `/shorts/${feature.id}` : "/shorts"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gainn-red text-white text-sm font-bold hover:brightness-110 active:scale-95 transition"
              >
                Watch Prime Time Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#tonights-lineup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
              >
                See tonight's lineup
              </a>
            </div>
          </div>

          {/* ── Preview card ── */}
          <div>
            <Link
              to={feature ? `/shorts/${feature.id}` : "/shorts"}
              className="group relative block overflow-hidden rounded-xl border border-white/10 aspect-video"
            >
              <img src={feature?.imageUrl || FALLBACK} alt={feature?.headline || "Prime Time preview"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6000ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/45" />

              <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gainn-red text-white text-[10px] font-mono font-bold tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" /> LIVE
              </span>

              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 rounded-full bg-white/15 border border-white/40 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </span>
              </span>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="font-display font-bold text-lg leading-snug text-white line-clamp-2">
                  {feature?.headline}
                </h2>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
                    <AudioLines className="w-4 h-4 animate-pulse" /> AI narration playing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="flex -space-x-2">
                      {["bg-primary/70", "bg-gainn-red/70", "bg-emerald-500/70"].map((c, i) => (
                        <span key={i} className={cn("w-5 h-5 rounded-full border border-black/60", c)} />
                      ))}
                    </span>
                    <span className="text-[10px] font-mono text-white/70">+2.4M watching</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Ticker under preview */}
            <div className="mt-3 h-8 rounded-full bg-surface-1 border border-border flex items-center overflow-hidden">
              <span className="flex-shrink-0 px-3 text-[10px] font-mono font-bold tracking-widest text-gainn-red">
                BREAKING
              </span>
              <div className="ticker-wrap flex-1 h-full flex items-center">
                <div className="ticker-content">
                  {[...tickerTopics, ...tickerTopics].map((t, i) => (
                    <span key={i} className="inline-flex items-center px-4 text-[11px] font-mono text-muted-foreground">
                      {t}<span className="ml-4 text-primary/40">·</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tonight's lineup grid ── */}
        <section id="tonights-lineup" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-primary">
              Tonight's Lineup
            </h2>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {isLive ? "Live feed" : "Demo feed"} · {articles.length} stories
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.slice(0, gridCount).map((a) => <StoryCard key={a.id} a={a} />)}
          </div>
          {gridCount < articles.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setGridCount((c) => c + 6)}
                className="px-6 py-2.5 rounded-full border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
              >
                Load More Stories →
              </button>
            </div>
          )}
        </section>

        {/* ── Newsletter ── */}
        <NewsletterBanner />
      </main>

      {/* ── System status strip ── */}
      <footer className="border-t border-border mt-8">
        <div className="px-4 md:px-6 py-3 bg-surface-1">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-gainn-green font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-gainn-green live-dot" /> ALL SYSTEMS OPERATIONAL
              </span>
              <span className="text-border">|</span>
              <span>Ingestion: <span className="text-gainn-green">●</span></span>
              <span>Verification: <span className="text-gainn-green">●</span></span>
              <span>Generation: <span className="text-gainn-green">●</span></span>
              <span>Distribution: <span className="text-gainn-green">●</span></span>
            </div>
            <span>{clock.toLocaleTimeString("en-US", { hour12: false })} UTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
