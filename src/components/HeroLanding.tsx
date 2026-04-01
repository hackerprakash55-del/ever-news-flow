import { useEffect, useState, useRef } from "react";
import { ArrowDown, Play, Zap, Globe, Bot, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Animated count-up
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

const METRICS = [
  { icon: Zap, label: "Articles Generated Today", value: 1247, suffix: "", color: "text-gainn-cyan" },
  { icon: Globe, label: "Countries Covered", value: 34, suffix: "", color: "text-accent" },
  { icon: Bot, label: "Active AI Agents", value: 108, suffix: "", color: "text-gainn-green" },
  { icon: Timer, label: "Avg Generation Time", value: 2.4, suffix: "s", color: "text-gainn-amber", decimal: true },
];

export const HeroLanding = ({ onViewFeed, onHowItWorks }: { onViewFeed: () => void; onHowItWorks: () => void }) => {
  // Live incrementing articles count
  const [liveArticles, setLiveArticles] = useState(1247);
  useEffect(() => {
    const iv = setInterval(() => setLiveArticles(p => p + Math.floor(Math.random() * 3) + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-16 md:py-24 relative">
        {/* System status badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gainn-green/30 bg-gainn-green/5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-gainn-green live-dot" />
            <span className="text-gainn-green font-semibold">SYSTEM ONLINE</span>
            <span className="text-muted-foreground">— 108 agents active across 34 countries</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground mb-6 leading-[1.1]">
            Autonomous{" "}
            <span className="text-gradient-primary">AI News Agency</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI agents ingest, verify, and generate real-time news —{" "}
            <span className="text-accent font-semibold">without human intervention.</span>
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <Button
            onClick={onViewFeed}
            className="h-12 px-8 text-sm font-semibold gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" /> View Live Feed
          </Button>
          <Button
            variant="outline"
            onClick={onHowItWorks}
            className="h-12 px-8 text-sm font-semibold gap-2 border-border hover:border-primary/40 hover:bg-primary/5"
          >
            <Play className="w-4 h-4" /> See How It Works
          </Button>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const raw = m.label === "Articles Generated Today" ? liveArticles : m.value;
            const count = useCountUp(m.decimal ? Math.floor(raw as number * 10) : raw as number, 1800);
            const display = m.decimal ? (count / 10).toFixed(1) : count.toLocaleString();

            return (
              <div
                key={m.label}
                className="card-glass rounded-lg p-4 text-center group hover:border-primary/30 transition-colors"
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${m.color}`} />
                <div className={`text-2xl md:text-3xl font-bold font-mono ${m.color} mb-1`}>
                  {display}{m.suffix}
                  {m.label === "Articles Generated Today" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gainn-green live-dot ml-2 align-middle" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">{m.label}</div>
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
