import { useEffect, useState, useRef, useMemo } from "react";
import { ArrowDown, Play, Zap, Globe, Bot, Timer, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Animated count-up ──────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Animated grid background ───────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" style={{ zIndex: 2 }} />

      {/* Animated grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* Flowing data streams */}
      <div className="absolute top-0 left-[20%] w-px h-full opacity-20">
        <div className="w-full h-32 bg-gradient-to-b from-transparent via-primary to-transparent animate-data-flow" style={{ animationDuration: "3s", animationIterationCount: "infinite" }} />
      </div>
      <div className="absolute top-0 left-[45%] w-px h-full opacity-15">
        <div className="w-full h-24 bg-gradient-to-b from-transparent via-accent to-transparent animate-data-flow" style={{ animationDuration: "4s", animationDelay: "1s", animationIterationCount: "infinite" }} />
      </div>
      <div className="absolute top-0 left-[72%] w-px h-full opacity-20">
        <div className="w-full h-28 bg-gradient-to-b from-transparent via-gainn-green to-transparent animate-data-flow" style={{ animationDuration: "3.5s", animationDelay: "2s", animationIterationCount: "infinite" }} />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[80px]" />
    </div>
  );
}

// ── Live activity ticker ───────────────────────────────────
const ACTIVITIES = [
  "Ingestion Agent scanning 847 RSS feeds…",
  "Verification Agent cross-checking 3 sources on climate data…",
  "Generation Agent composing article on quantum breakthrough…",
  "Distribution Agent publishing to 5 platforms…",
  "Monitor Beta analyzing social media sentiment…",
  "Research Gamma indexing 12 scientific papers…",
  "Verifier Alpha confirming financial data integrity…",
  "Editor Agent checking bias score — 0.01 approved…",
];

function LiveActivityTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 2800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-surface-1/50 backdrop-blur-sm max-w-xl mx-auto">
      <Activity className="w-3.5 h-3.5 text-gainn-green flex-shrink-0 animate-pulse" />
      <span className="text-[11px] font-mono text-muted-foreground truncate" key={idx}>
        <span className="text-gainn-green">▸</span> {ACTIVITIES[idx]}
      </span>
    </div>
  );
}

// ── Metrics ────────────────────────────────────────────────
const METRICS = [
  { icon: Zap, label: "Articles Generated Today", value: 1247, suffix: "", color: "text-gainn-cyan", bg: "bg-gainn-cyan/10 border-gainn-cyan/20" },
  { icon: Globe, label: "Countries Covered", value: 34, suffix: "", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  { icon: Bot, label: "Active AI Agents", value: 108, suffix: "", color: "text-gainn-green", bg: "bg-gainn-green/10 border-gainn-green/20" },
  { icon: Timer, label: "Avg Generation Time", value: 2.4, suffix: "s", color: "text-gainn-amber", bg: "bg-gainn-amber/10 border-gainn-amber/20", decimal: true },
];

export const HeroLanding = ({ onViewFeed, onHowItWorks }: { onViewFeed: () => void; onHowItWorks: () => void }) => {
  const [liveArticles, setLiveArticles] = useState(1247);
  useEffect(() => {
    const iv = setInterval(() => setLiveArticles(p => p + Math.floor(Math.random() * 3) + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "min(90vh, 700px)" }}>
      <GridBackground />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-16 md:py-24 relative" style={{ zIndex: 3 }}>
        {/* System status badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gainn-green/30 bg-gainn-green/5 text-xs font-mono backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-gainn-green live-dot" />
            <span className="text-gainn-green font-bold tracking-wide">SYSTEM ONLINE</span>
            <span className="text-muted-foreground hidden sm:inline">— 108 agents active across 34 countries</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground mb-6 leading-[1.05]">
            Autonomous{" "}
            <span className="text-gradient-primary">AI News Agency</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            AI agents ingest, verify, and generate real-time news —{" "}
            <span className="text-accent font-semibold">without human intervention.</span>
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 max-w-lg mx-auto">
            Multi-agent architecture • Real-time verification • Zero editorial bias • 24/7 autonomous operation
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Button
            onClick={onViewFeed}
            className="h-12 px-8 text-sm font-semibold gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity shadow-glow-blue"
          >
            <Zap className="w-4 h-4" /> View Live Feed
          </Button>
          <Button
            variant="outline"
            onClick={onHowItWorks}
            className="h-12 px-8 text-sm font-semibold gap-2 border-border hover:border-primary/40 hover:bg-primary/5"
          >
            <Play className="w-4 h-4" /> Watch System in Action
          </Button>
        </div>

        {/* Live activity ticker */}
        <div className="mb-12">
          <LiveActivityTicker />
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const raw = m.label === "Articles Generated Today" ? liveArticles : m.value;
            const count = useCountUp(m.decimal ? Math.floor(raw as number * 10) : raw as number, 1800);
            const display = m.decimal ? (count / 10).toFixed(1) : count.toLocaleString();

            return (
              <div
                key={m.label}
                className={`rounded-lg p-4 text-center border backdrop-blur-sm transition-all hover:scale-[1.02] ${m.bg}`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${m.color}`} />
                <div className={`text-2xl md:text-3xl font-bold font-mono ${m.color} mb-1`}>
                  {display}{m.suffix}
                  {m.label === "Articles Generated Today" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gainn-green live-dot ml-2 align-middle" />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-12">
          <button onClick={onViewFeed} className="animate-bounce text-muted-foreground hover:text-foreground transition-colors">
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
