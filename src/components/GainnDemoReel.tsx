import { useEffect, useState } from "react";
import { Radio, ShieldCheck, Sparkles, Clapperboard, Send } from "lucide-react";

const STEPS = [
  { icon: Radio,        title: "Ingest",     desc: "AI agents scan 1,200+ Indian & global sources every minute." },
  { icon: ShieldCheck,  title: "Verify",     desc: "Claims cross-checked across sources with a live trust score." },
  { icon: Sparkles,     title: "Write",      desc: "Editorial agents draft a clean, balanced, multi-perspective story." },
  { icon: Clapperboard, title: "Broadcast",  desc: "Every story becomes an AI-narrated video report & Short." },
  { icon: Send,         title: "Deliver",    desc: "Your personalised feed — Prime Time, Shorts and alerts." },
];

/** Auto-playing animated demo of how GAINN works — shown during sign up. */
export function GainnDemoReel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card-glass rounded-2xl border border-border p-6 space-y-5">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          How GAINN works
        </span>
      </div>

      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          const isDone = i < active;
          return (
            <div
              key={s.title}
              className={`relative flex items-start gap-3 rounded-xl p-3 transition-all duration-500 ${
                isActive
                  ? "bg-primary/10 border border-primary/30 scale-[1.02]"
                  : "border border-transparent opacity-50"
              }`}
            >
              <div
                className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                  isActive || isDone
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/20 text-muted-foreground border border-border"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              {isActive && (
                <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 justify-center pt-1">
        {STEPS.map((s, i) => (
          <span
            key={s.title}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === active ? "w-6 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}