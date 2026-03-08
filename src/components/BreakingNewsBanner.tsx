import { BREAKING_ALERTS, BreakingAlert } from "@/data/mockData";
import { useNews } from "@/hooks/useNews";
import { Zap } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

const severityStyles = {
  breaking: "border-gainn-red/40 bg-gainn-red/5",
  urgent: "border-gainn-amber/40 bg-gainn-amber/5",
  developing: "border-gainn-blue/40 bg-gainn-blue/5",
};

const severityLabel = {
  breaking: "text-gainn-red",
  urgent: "text-gainn-amber",
  developing: "text-gainn-blue",
};

export const BreakingNewsBanner = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const { articles, isLive } = useNews({ pageSize: 20 });

  // Derive alerts from live breaking articles, fall back to mock
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

  useEffect(() => {
    setCurrentIdx(0);
  }, [alerts]);

  useEffect(() => {
    if (alerts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx((i) => (i + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts]);

  const alert = alerts[currentIdx] ?? alerts[0];

  return (
    <div className={`rounded-lg border p-3 flex items-start gap-3 transition-all duration-500 ${severityStyles[alert.severity]}`}>
      <div className={`flex-shrink-0 flex items-center gap-1.5 pt-0.5 ${severityLabel[alert.severity]}`}>
        <Zap className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{alert.severity}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{alert.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-muted-foreground">{alert.region}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-gainn-cyan font-mono">AI Verified</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLive && (
          <span className="text-[10px] font-mono text-gainn-green hidden sm:inline">● Live</span>
        )}
        <div className="flex gap-1">
          {alerts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? "bg-gainn-red w-3" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatsBar = () => {
  const stats = [
    { label: "Articles Published Today", value: "1,247", color: "text-gainn-cyan" },
    { label: "Sources Monitored", value: "12,891", color: "text-gainn-blue" },
    { label: "Fact Checks Completed", value: "8,432", color: "text-gainn-green" },
    { label: "Misinformation Blocked", value: "384", color: "text-gainn-red" },
    { label: "Languages Supported", value: "52", color: "text-gainn-purple" },
    { label: "Agent Uptime", value: "99.7%", color: "text-gainn-amber" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border rounded-lg overflow-hidden">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface-1 px-3 py-2.5 text-center">
          <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};
