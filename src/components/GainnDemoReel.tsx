import { useEffect, useRef, useState } from "react";
import { Radio, ShieldCheck, Sparkles, Play, Search } from "lucide-react";

/**
 * Simulated screen-recording of the GAINN product.
 * A fake browser window that "plays" the real product flow scene by scene.
 */

const SCENES = [
  { key: "scan",   label: "Scanning live sources",     url: "gainn.ai/live",       icon: Search },
  { key: "verify", label: "Verifying with AI agents",  url: "gainn.ai/newsroom",   icon: ShieldCheck },
  { key: "write",  label: "Writing the story",         url: "gainn.ai/article",    icon: Sparkles },
  { key: "video",  label: "AI video report",           url: "gainn.ai/prime-time", icon: Play },
  { key: "feed",   label: "Your personalised feed",    url: "gainn.ai",            icon: Radio },
] as const;

const SCENE_MS = 4200;
const TICK_MS = 60;

const SOURCES = [
  "Times of India", "The Hindu", "NDTV", "Indian Express", "Mint",
  "Hindustan Times", "News18", "Reuters", "PTI", "ANI",
];

const HEADLINE = "Parliament clears new digital infrastructure bill";
const BODY = "Verified across 7 independent sources. GAINN's editorial agent balanced three perspectives before publishing.";

export function GainnDemoReel() {
  const [scene, setScene] = useState(0);
  const [t, setT] = useState(0); // 0 → 1 progress inside the current scene
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const p = (Date.now() - started) / SCENE_MS;
      if (p >= 1) {
        setScene((s) => (s + 1) % SCENES.length);
        setT(0);
      } else setT(p);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [scene]);

  const current = SCENES[scene];
  const Icon = current.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Live product demo — no sign-up needed to watch
        </span>
      </div>

      {/* Fake browser window */}
      <div className="rounded-2xl border border-border overflow-hidden card-glass shadow-elevated">
        {/* Chrome */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-white/[0.03]">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <div className="ml-2 flex-1 rounded-md bg-black/30 border border-border px-2.5 py-1">
            <span className="text-[10px] font-mono text-muted-foreground">{current.url}</span>
          </div>
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Screen */}
        <div className="relative h-[320px] overflow-hidden bg-[hsl(222_40%_5%)]">
          {scene === 0 && <SceneScan t={t} />}
          {scene === 1 && <SceneVerify t={t} />}
          {scene === 2 && <SceneWrite t={t} />}
          {scene === 3 && <SceneVideo t={t} />}
          {scene === 4 && <SceneFeed t={t} />}

          {/* Simulated cursor */}
          <div
            className="pointer-events-none absolute w-3 h-3 rounded-full border border-primary bg-primary/40 transition-none"
            style={{
              left: `${20 + Math.sin(t * Math.PI * 2 + scene) * 30 + t * 40}%`,
              top: `${35 + Math.cos(t * Math.PI * 2 + scene) * 22}%`,
              boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
            }}
          />
        </div>

        {/* Playback bar */}
        <div className="px-3 py-2 border-t border-border bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-1.5">
            <Play className="w-3 h-3 text-primary fill-primary" />
            <span className="text-[11px] text-foreground/80 flex-1 truncate">{current.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              0{scene + 1}/0{SCENES.length}
            </span>
          </div>
          <div className="h-0.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${((scene + t) / SCENES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scenes ---------- */

function SceneScan({ t }: { t: number }) {
  const shown = Math.min(SOURCES.length, Math.floor(t * SOURCES.length * 1.4));
  return (
    <div className="p-4 h-full">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
        Ingestion agent · {Math.floor(120 + t * 880)} articles/min
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SOURCES.slice(0, shown).map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-2.5 py-2 animate-fade-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-foreground/80 truncate">{s}</span>
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">OK</span>
          </div>
        ))}
      </div>
      {/* scanning sweep */}
      <div
        className="absolute inset-x-0 h-16 pointer-events-none"
        style={{
          top: `${t * 100}%`,
          background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.10), transparent)",
        }}
      />
    </div>
  );
}

function SceneVerify({ t }: { t: number }) {
  const score = Math.round(t * 94);
  const checks = ["Cross-source match", "Claim extraction", "Contradiction scan", "Trust scoring"];
  return (
    <div className="p-4 h-full space-y-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
        Verification agent
      </div>
      <div className="rounded-xl border border-border bg-white/[0.03] p-3">
        <p className="text-xs text-foreground/90 mb-3 leading-snug">{HEADLINE}</p>
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 100} 100`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-primary">
              {score}%
            </span>
          </div>
          <div className="flex-1 space-y-1.5">
            {checks.map((c, i) => {
              const done = t > (i + 1) / (checks.length + 0.5);
              return (
                <div key={c} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${done ? "bg-primary/25 text-primary" : "bg-muted/20 text-muted-foreground"}`}>
                    {done ? "✓" : "·"}
                  </span>
                  <span className={`text-[10px] ${done ? "text-foreground/80" : "text-muted-foreground"}`}>{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneWrite({ t }: { t: number }) {
  const full = `${HEADLINE}\n\n${BODY}`;
  const text = full.slice(0, Math.floor(t * full.length * 1.25));
  return (
    <div className="p-4 h-full">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
        Editorial agent · drafting
      </div>
      <div className="rounded-xl border border-border bg-white/[0.03] p-4 h-[230px]">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
          {text}
          <span className="inline-block w-[2px] h-4 align-middle bg-primary animate-pulse ml-0.5" />
        </p>
      </div>
    </div>
  );
}

function SceneVideo({ t }: { t: number }) {
  const bars = 28;
  return (
    <div className="p-4 h-full">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
        AI anchor · narrating report
      </div>
      <div
        className="relative rounded-xl overflow-hidden border border-border h-[230px] flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(135deg, hsl(200 90% 20%), hsl(222 60% 8%) 60%, hsl(350 70% 22%))" }}
      >
        <p className="px-6 text-center text-sm text-white/95 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
          {HEADLINE}
        </p>
        <div className="flex items-end gap-1 h-10">
          {Array.from({ length: bars }).map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-primary"
              style={{
                height: `${12 + Math.abs(Math.sin(t * 14 + i * 0.6)) * 28}px`,
                opacity: 0.5 + Math.abs(Math.sin(t * 10 + i)) * 0.5,
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
          <div className="h-full bg-primary" style={{ width: `${t * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function SceneFeed({ t }: { t: number }) {
  const items = [
    { c: "Politics", h: "Parliament clears digital infrastructure bill", s: 94 },
    { c: "Business", h: "Rupee steadies as markets open higher", s: 91 },
    { c: "Crime",    h: "City police bust interstate fraud ring", s: 88 },
    { c: "Tech",     h: "Indian startups raise record AI funding", s: 90 },
  ];
  const shown = Math.min(items.length, Math.floor(t * items.length * 1.6) + 1);
  return (
    <div className="p-4 h-full space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
        Your feed · updated live
      </div>
      {items.slice(0, shown).map((it, i) => (
        <div
          key={it.h}
          className="rounded-xl border border-border bg-white/[0.03] p-3 animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-primary">{it.c}</span>
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">{it.s}% trust</span>
          </div>
          <p className="text-xs text-foreground/90 leading-snug">{it.h}</p>
        </div>
      ))}
    </div>
  );
}