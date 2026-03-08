import { PIPELINE_EVENTS } from "@/data/mockData";
import { useEffect, useState } from "react";
import { Activity, CheckCircle, AlertTriangle, Info, XCircle, Zap } from "lucide-react";

const typeIcon: Record<string, JSX.Element> = {
  monitor: <span className="text-gainn-blue">📡</span>,
  research: <span className="text-gainn-purple">🔬</span>,
  verify: <span className="text-gainn-amber">✔️</span>,
  editorial: <span className="text-gainn-cyan">✏️</span>,
  publish: <span className="text-gainn-green">📢</span>,
  alert: <span className="text-gainn-red">⚡</span>,
};

const statusStyles: Record<string, string> = {
  success: "text-gainn-green border-gainn-green/20 bg-gainn-green/5",
  info: "text-gainn-blue border-gainn-blue/20 bg-gainn-blue/5",
  warning: "text-gainn-amber border-gainn-amber/20 bg-gainn-amber/5",
  error: "text-gainn-red border-gainn-red/20 bg-gainn-red/5",
};

export const PipelineLog = () => {
  const [events, setEvents] = useState(PIPELINE_EVENTS);
  const [count, setCount] = useState(0);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = {
        id: `evt-live-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        type: ["monitor", "verify", "research", "editorial", "publish"][Math.floor(Math.random() * 5)] as any,
        agentId: "live",
        agentName: ["Monitor Alpha", "Verifier Beta", "Research Gamma", "Editor Alpha", "Reporter Beta"][Math.floor(Math.random() * 5)],
        message: [
          "New signal detected: Economic indicator release",
          "Credibility check passed — 3 sources confirmed",
          "Background research complete — 12 documents indexed",
          "Bias score: 0.01 — approved for publication",
          "Article queued for distribution across 5 platforms",
        ][Math.floor(Math.random() * 5)],
        status: ["success", "info", "success", "success", "info"][Math.floor(Math.random() * 5)] as any,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setCount((c) => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-glass rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <Activity className="w-4 h-4 text-gainn-cyan" />
        <span className="text-sm font-semibold">Live Pipeline Log</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-gainn-green">
          <span className="w-1.5 h-1.5 rounded-full bg-gainn-green animate-pulse" />
          Live
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {events.map((evt) => (
          <div
            key={evt.id}
            className={`flex gap-2.5 p-2 rounded border text-xs fade-in-up ${statusStyles[evt.status]}`}
          >
            <span className="flex-shrink-0 text-sm">{typeIcon[evt.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[10px] truncate">{evt.agentName}</span>
                <span className="font-mono text-[9px] opacity-60 flex-shrink-0">{evt.timestamp}</span>
              </div>
              <div className="truncate opacity-90">{evt.message}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-2 flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground">
          {events.length} events | {count} live updates
        </span>
      </div>
    </div>
  );
};
