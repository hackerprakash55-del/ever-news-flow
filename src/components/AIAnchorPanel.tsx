import { ArrowRight, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNews } from "@/hooks/useNews";

export const AIAnchorPanel = () => {
  const [selected, setSelected] = useState(0);
  const [typedWords, setTypedWords] = useState(1);
  // Share the homepage news cache (pageSize=30) — avoids a second slow
  // fetch-news edge-function call on every page load.
  const { articles, isLoading } = useNews({ pageSize: 30 });
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
  const headlineWords = (current?.title ?? "Loading live feed").split(/\s+/).filter(Boolean);

  useEffect(() => {
    setTypedWords(1);
    if (!headlineWords.length) return;
    const timer = window.setInterval(() => {
      setTypedWords((count) => (count >= headlineWords.length ? 1 : count + 1));
    }, 260);
    return () => window.clearInterval(timer);
  }, [current?.id, headlineWords.length]);

  const openCurrent = () => {
    if (!current) return;
    navigate(`/article/${current.id}`, { state: { article: articles[selected] } });
  };

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
        {/* Live broadcast panel */}
        <div
          className="relative bg-surface-0 overflow-hidden"
          style={{
            minHeight: 220,
            backgroundImage: `${current?.imageUrl ? `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.78)), url(${current.imageUrl})` : "linear-gradient(135deg, #0a0818 0%, #2d1b69 100%)"}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
          <div className="absolute inset-0 film-grain opacity-30 pointer-events-none" />

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-gainn-red text-white text-[9px] font-bold tracking-widest rounded live-dot">
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
              {headlineWords.slice(0, typedWords).join(" ")}
              <span className="inline-block w-1.5 h-3 ml-1 bg-gainn-cyan align-[-2px] animate-pulse" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md px-5 py-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gainn-red/40 bg-gainn-red/15 px-3 py-1 text-[10px] font-bold font-mono text-gainn-red tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-gainn-red live-dot" /> LIVE BROADCAST
              </div>
              <p className="max-w-sm text-sm font-display text-white line-clamp-2">{current?.title ?? "Loading live feed…"}</p>
              <button
                onClick={openCurrent}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gainn-cyan px-4 py-2 text-xs font-bold text-background transition-transform hover:scale-[1.03]"
              >
                Read Full Story <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="absolute top-3 right-3 flex items-end gap-0.5">
            {[3, 5, 4, 7, 3].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-gainn-cyan animate-ai-wave" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
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
                    onClick={() => { setSelected(i); navigate(`/article/${seg.id}`, { state: { article: articles[i] } }); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 transition-colors hover:bg-surface-2 ${
                      selected === i ? "bg-gainn-blue/10 border-l-2 border-l-gainn-blue" : ""
                    }`}
                  >
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${
                      selected === i ? "ring-2 ring-gainn-blue" : "bg-surface-2"
                    }`}>
                      {seg.imageUrl ? (
                        <span className="w-full h-full" style={{ background: "linear-gradient(135deg, #0a0818 0%, #2d1b69 100%)" }} />
                      ) : seg.live ? (
                        <span className="w-2 h-2 rounded-full bg-gainn-red live-dot" />
                      ) : (
                        <Radio className="w-3 h-3 text-muted-foreground" />
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
