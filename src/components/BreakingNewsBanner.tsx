import { BREAKING_ALERTS, BreakingAlert } from "@/data/mockData";
import { useNews } from "@/hooks/useNews";
import { Zap, TrendingUp } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";

// ── Animated Count-Up ──────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Breaking Banner ────────────────────────────────────────
export const BreakingNewsBanner = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  // Use pageSize=30 so this shares the React-Query cache with Index/AIAnchorPanel
  // (one network call powers the whole homepage instead of three).
  const { articles, isLive } = useNews({ pageSize: 30 });

  const alerts: BreakingAlert[] = useMemo(() => {
    if (!isLive || articles.length === 0) return BREAKING_ALERTS;
    const breaking = articles.filter((a) => a.isBreaking);
    const pool = breaking.length > 0 ? breaking : articles.slice(0, 5);
    return pool.slice(0, 6).map((a, i) => ({
      id: a.id,
      text: a.headline,
      region: a.region || "Global",
      severity: (i === 0 ? "breaking" : i === 1 ? "urgent" : "developing") as BreakingAlert["severity"],
    }));
  }, [articles, isLive]);

  useEffect(() => { setCurrentIdx(0); }, [alerts]);
  useEffect(() => {
    if (alerts.length === 0) return;
    const interval = setInterval(() => setCurrentIdx((i) => (i + 1) % alerts.length), 6000);
    return () => clearInterval(interval);
  }, [alerts]);

  const alert = alerts[currentIdx] ?? alerts[0];

  return (
    <div className="relative overflow-hidden rounded-lg border border-gainn-red/50 bg-gainn-red/8 shadow-[0_0_20px_hsl(0_90%_58%/0.15)]">
      {/* Full-width animated red bar at top */}
      <div className="h-0.5 w-full breaking-bar" style={{ background: "var(--gradient-breaking)" }} />
      <div className="flex items-center gap-0 min-h-[52px]">
        {/* Severity label block */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-gainn-red text-white h-full">
          <span className="w-2 h-2 rounded-full bg-white live-dot" />
          <Zap className="w-3.5 h-3.5 bolt-swing" />
          <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
            {alert.severity}
          </span>
        </div>
        {/* Alert text — slides in */}
        <div className="flex-1 min-w-0 px-4 py-3 overflow-hidden">
          <p
            key={currentIdx}
            className="text-sm font-semibold text-foreground leading-snug animate-fade-in-up"
          >
            {alert.text}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-mono text-muted-foreground">{alert.region}</span>
            <span className="text-[10px] text-gainn-cyan font-mono">✦ AI Verified</span>
            {isLive && <span className="text-[10px] font-mono text-gainn-green">● Live Feed</span>}
          </div>
        </div>
        {/* Dot nav */}
        <div className="flex-shrink-0 flex items-center gap-1.5 pr-4">
          {alerts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? "bg-gainn-red w-5 h-1.5"
                  : "bg-muted-foreground/30 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Animated Stats Bar ─────────────────────────────────────
const StatItem = ({ label, value, rawValue, color, isLive }: {
  label: string; value: string; rawValue: number; color: string; isLive?: boolean;
}) => {
  const count = useCountUp(rawValue, 1400);
  const formatted = count.toLocaleString();

  return (
    <div className="bg-surface-1 px-3 py-3 text-center relative group">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        <div className={`text-lg font-bold font-mono ${color}`}>{formatted}{value.includes("%") ? "%" : ""}</div>
        {isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-gainn-green live-dot" />
        )}
      </div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
};

export const StatsBar = () => {
  const stats = [
    { label: "Articles Today", value: "1,247", rawValue: 1247, color: "text-gainn-cyan", isLive: true },
    { label: "Sources Monitored", value: "12,891", rawValue: 12891, color: "text-accent" },
    { label: "Fact Checks", value: "8,432", rawValue: 8432, color: "text-gainn-green", isLive: true },
    { label: "Misinformation Blocked", value: "384", rawValue: 384, color: "text-gainn-red" },
    { label: "Languages", value: "52", rawValue: 52, color: "text-gainn-purple" },
    { label: "Agent Uptime", value: "99.7%", rawValue: 99, color: "text-gainn-amber" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border rounded-lg overflow-hidden border border-border">
      {stats.map((stat) => (
        <StatItem key={stat.label} {...stat} />
      ))}
    </div>
  );
};
