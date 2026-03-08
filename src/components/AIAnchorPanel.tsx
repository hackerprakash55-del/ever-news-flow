import aiAnchorImg from "@/assets/ai-anchor.jpg";
import { Play, Radio, Mic, Volume2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NEWS_SEGMENTS = [
  { id: 1, title: "AI Summit: World Leaders Sign Historic Accord", duration: "3:47", live: true },
  { id: 2, title: "Mars Discovery: What Scientists Found", duration: "5:12", live: false },
  { id: 3, title: "Quantum Computing Changes Everything", duration: "4:28", live: false },
  { id: 4, title: "Arctic Climate Emergency Special Report", duration: "6:03", live: false },
];

export const AIAnchorPanel = () => {
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(0);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-gainn-red animate-live-pulse" />
          <span className="text-sm font-semibold">AI News Channel</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-mono text-gainn-red">
          <span className="w-1.5 h-1.5 rounded-full bg-gainn-red live-dot" />
          LIVE BROADCAST
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Video panel */}
        <div className="relative bg-surface-0 overflow-hidden" style={{ minHeight: 220 }}>
          <img
            src={aiAnchorImg}
            alt="GAINN AI Anchor"
            className="w-full h-full object-cover"
            style={{ minHeight: 220 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-gainn-red text-white text-[9px] font-bold tracking-widest rounded">
                LIVE
              </span>
              <span className="text-white text-[10px] font-mono">GAINN • AI ANCHOR</span>
            </div>
            <div className="text-white text-xs font-medium truncate">
              {NEWS_SEGMENTS[selected].title}
            </div>
          </div>

          {/* Center play button */}
          <button
            onClick={() => setPlaying(!playing)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gainn-blue/80 hover:bg-gainn-blue flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
          >
            {playing ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          {/* Voice indicator */}
          {playing && (
            <div className="absolute top-3 right-3 flex items-end gap-0.5">
              {[3, 5, 4, 7, 3, 6, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gainn-cyan"
                  style={{
                    height: `${h * 2}px`,
                    animation: `data-stream ${0.3 + i * 0.1}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Playlist */}
        <div className="flex flex-col">
          <div className="px-3 py-2 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Upcoming Segments
          </div>
          <div className="flex-1 overflow-y-auto">
            {NEWS_SEGMENTS.map((seg, i) => (
              <button
                key={seg.id}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 transition-colors hover:bg-surface-2 ${
                  selected === i ? "bg-gainn-blue/10 border-l-2 border-l-gainn-blue" : ""
                }`}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                  selected === i ? "bg-gainn-blue" : "bg-surface-2"
                }`}>
                  {seg.live ? (
                    <span className="w-2 h-2 rounded-full bg-gainn-red live-dot" />
                  ) : (
                    <Play className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{seg.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{seg.duration}</div>
                </div>
                {seg.live && (
                  <span className="text-[9px] font-bold text-gainn-red px-1.5 py-0.5 rounded border border-gainn-red/30 flex-shrink-0">
                    LIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
