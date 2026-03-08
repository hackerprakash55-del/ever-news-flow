import { useEffect, useState } from "react";
import { WORLD_NEWS_PINS } from "@/data/mockData";
import { Globe } from "lucide-react";
import worldMapBg from "@/assets/world-map-bg.jpg";

type Pin = typeof WORLD_NEWS_PINS[0];

const severityColor: Record<string, string> = {
  breaking: "#ef4444",
  urgent: "#f59e0b",
  developing: "#0ea5e9",
};

const latLngToPercent = (lat: number, lng: number) => ({
  x: ((lng + 180) / 360) * 100,
  y: ((90 - lat) / 180) * 100,
});

export const WorldNewsMap = () => {
  const [active, setActive] = useState<Pin | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gainn-cyan" />
          <span className="text-sm font-semibold">Global Breaking News Radar</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gainn-red" /> Breaking
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gainn-amber" /> Urgent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gainn-blue" /> Developing
          </span>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        {/* World map background */}
        <img
          src={worldMapBg}
          alt="World Map"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/40" />

        {/* News pins */}
        {WORLD_NEWS_PINS.map((pin, i) => {
          const { x, y } = latLngToPercent(pin.lat, pin.lng);
          const color = severityColor[pin.severity];
          const isActive = active?.id === pin.id;
          const isPulsing = (tick + i) % WORLD_NEWS_PINS.length === i % 3;

          return (
            <div
              key={pin.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setActive(pin)}
              onMouseLeave={() => setActive(null)}
            >
              {/* Ping ring */}
              {isPulsing && (
                <span
                  className="absolute inset-0 rounded-full animate-map-ping"
                  style={{ background: color, opacity: 0.4, width: 20, height: 20, left: -4, top: -4 }}
                />
              )}
              {/* Dot */}
              <div
                className="w-3 h-3 rounded-full border-2 border-background shadow-lg transition-transform hover:scale-150"
                style={{ background: color }}
              />
              {/* Tooltip */}
              {isActive && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <div className="bg-surface-1 border border-border rounded px-2.5 py-1.5 shadow-elevated">
                    <div className="text-xs font-medium text-foreground">{pin.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{pin.region}</div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color }}
                    >
                      {pin.severity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {WORLD_NEWS_PINS.length} active events monitored
        </span>
        <span className="text-xs text-gainn-cyan font-mono">Real-time satellite feeds</span>
      </div>
    </div>
  );
};
