import { Link, useNavigate } from "react-router-dom";
import { useNews } from "@/hooks/useNews";
import { Play, ChevronRight } from "lucide-react";

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
    <section aria-label="Shorts">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">Shorts</h2>
        <Link to="/shorts" className="ml-auto text-xs text-accent hover:underline">View all</Link>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {shorts.map((a, i) => (
          <button
            key={a.id + i}
            onClick={() => navigate("/shorts")}
            className="group relative flex-shrink-0 w-[96px] h-32 rounded-xl overflow-hidden border border-border bg-surface-2 hover:border-accent/50 transition-colors"
          >
            {a.imageUrl && (
              <img src={a.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background/90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-foreground/90 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-background fill-current ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-1.5 left-2 right-2">
              <span className="block text-[10px] uppercase tracking-wider text-foreground/80 truncate">
                {a.category}
              </span>
            </div>
          </button>
        ))}

        <Link
          to="/shorts"
          className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-32 text-muted-foreground hover:text-accent transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="text-[10px] mt-1">More</span>
        </Link>
      </div>
    </section>
  );
}