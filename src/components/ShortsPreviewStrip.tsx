import { Link, useNavigate } from "react-router-dom";
import { useNews } from "@/hooks/useNews";
import { Zap, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg,#06b6d4 0%,#7c3aed 100%)",
  "linear-gradient(135deg,#ef4444 0%,#f97316 100%)",
  "linear-gradient(135deg,#10b981 0%,#0ea5e9 100%)",
  "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)",
];

/**
 * Horizontal preview strip that funnels homepage traffic into /shorts.
 * Reuses the same India-first useNews cache so it costs zero extra API calls.
 */
export function ShortsPreviewStrip() {
  const { articles } = useNews({ pageSize: 20, location: "India" });
  const navigate = useNavigate();
  const shorts = articles.slice(0, 4);
  if (shorts.length === 0) return null;

  return (
    <section aria-label="AI Shorts preview" className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/5 via-background to-red-500/5 p-3 md:p-4">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* Label chip */}
        <Link
          to="/shorts"
          className="group flex-shrink-0 flex flex-col items-center justify-center w-20 h-28 rounded-2xl bg-gradient-to-b from-cyan-500/25 to-cyan-500/5 border border-cyan-400/40 hover:border-cyan-400/70 transition-all"
        >
          <Zap className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-wider text-cyan-200 mt-1">AI SHORTS</span>
          <span className="text-[9px] text-cyan-100/70 font-mono mt-0.5">Watch now</span>
        </Link>

        {/* Thumbnails */}
        {shorts.map((a, i) => (
          <button
            key={a.id + i}
            onClick={() => navigate("/shorts")}
            className="group relative flex-shrink-0 w-[76px] h-28 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/60 hover:scale-[1.04] transition-all"
            style={{ background: a.imageUrl ? undefined : GRADIENTS[i % GRADIENTS.length] }}
          >
            {a.imageUrl && (
              <img src={a.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/85" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-1 left-1 right-1">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/95 truncate">
                {a.category}
              </span>
            </div>
            {i === 0 && (
              <span className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
          </button>
        ))}

        {/* See all */}
        <Link
          to="/shorts"
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center w-14 h-28 text-white/50 hover:text-cyan-300 transition-colors"
          )}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="text-[10px] font-mono mt-1">See all</span>
        </Link>
      </div>
    </section>
  );
}