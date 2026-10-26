import { BreakingAlert } from "@/data/mockData";
import { useNews } from "@/hooks/useNews";
import { Zap } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

// ── Breaking Banner ────────────────────────────────────────
export const BreakingNewsBanner = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  // Use pageSize=30 so this shares the React-Query cache with Index/AIAnchorPanel
  // (one network call powers the whole homepage instead of three).
  const { articles, isLive } = useNews({ pageSize: 30 });

  const alerts: BreakingAlert[] = useMemo(() => {
    // Never invent breaking news — show nothing when the live feed is down.
    if (!isLive || articles.length === 0) return [];
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

  if (alerts.length === 0) return null;
  const alert = alerts[currentIdx] ?? alerts[0];

  return (
    <div className="relative overflow-hidden rounded-lg border border-gainn-red/50 bg-gainn-red/8 shadow-[0_0_20px_hsl(0_90%_58%/0.15)]">
      {/* Full-width animated red bar at top */}
      <div className="h-0.5 w-full breaking-bar" style={{ background: "var(--gradient-breaking)" }} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-0 min-h-[52px]">
        {/* Severity label block */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 sm:py-3 bg-gainn-red text-white sm:self-stretch">
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
            <span className="text-[10px] text-gainn-cyan font-mono">✦ Source shown</span>
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

