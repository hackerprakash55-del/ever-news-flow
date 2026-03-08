import aiAnchorImg from "@/assets/ai-anchor.jpg";
import { Play, Radio, Volume2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNews } from "@/hooks/useNews";

export const AIAnchorPanel = () => {
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(0);
  const { articles, isLoading } = useNews({ pageSize: 6 });
  const navigate = useNavigate();

  const segments = articles.slice(0, 6).map((a, i) => ({
    id: a.id,
    title: a.headline,
    duration: `${a.readTime}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}`,
    live: i === 0,
    category: a.category,
    imageUrl: a.imageUrl,
  }));

  const current = segments[selected];

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
          {current?.imageUrl ? (
            <img
              src={current.imageUrl}
              alt={current?.title}
              className="w-full h-full object-cover"
              style={{ minHeight: 220 }}
              onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <img
              src={aiAnchorImg}
              alt="GAINN AI Anchor"
              className="w-full h-full object-cover"
              style={{ minHeight: 220 }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-gainn-red text-white text-[9px] font-bold tracking-widest rounded">
                LIVE
              </span>
              <span className="text-white text-[10px] font-mono">GAINN • AI ANCHOR</span>
              {current?.category && (
                <span className="px-1.5 py-0.5 bg-gainn-blue/80 text-white text-[9px] font-bold tracking-wider rounded">
                  {current.category.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-white text-xs font-medium line-clamp-2">
              {current?.title ?? "Loading live feed…"}
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
          <div className="px-3 py-2 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>Live Segments</span>
            {isLoading && <span className="w-1.5 h-1.5 rounded-full bg-gainn-cyan live-dot" />}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50">
                    <div className="w-7 h-7 rounded bg-surface-2 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 rounded bg-surface-2 animate-pulse w-full" />
                      <div className="h-2 rounded bg-surface-2 animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              : segments.map((seg, i) => (
                  <button
                    key={seg.id}
                    onClick={() => { setSelected(i); navigate(`/article/${seg.id}`); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 transition-colors hover:bg-surface-2 ${
                      selected === i ? "bg-gainn-blue/10 border-l-2 border-l-gainn-blue" : ""
                    }`}
                  >
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${
                      selected === i ? "ring-2 ring-gainn-blue" : "bg-surface-2"
                    }`}>
                      {seg.imageUrl ? (
                        <img src={seg.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : seg.live ? (
                        <span className="w-2 h-2 rounded-full bg-gainn-red live-dot" />
                      ) : (
                        <Play className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{seg.title}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{seg.duration} read</div>
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
