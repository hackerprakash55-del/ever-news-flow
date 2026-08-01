import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Play, Volume2, VolumeX, Clapperboard, ShieldCheck } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=80";

export const PrimeTimeHero = () => {
  const { articles } = useNews({ pageSize: 20, location: "India" });
  const [muted, setMuted] = useState(false);

  const withImages = useMemo(
    () => articles.filter((a) => !!a.imageUrl),
    [articles]
  );
  const lead = withImages[0] ?? articles[0];
  const rundown = (withImages.length >= 5 ? withImages : articles).slice(1, 6);
  const ticker = articles.slice(0, 3).map((a) => a.headline);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
      {/* ── Cinematic hero band ── */}
      <div>
        <Link
          to="/prime-time"
          className="group relative block overflow-hidden rounded-xl border border-white/10 aspect-[16/9] md:aspect-[21/9]"
        >
          <img
            src={lead?.imageUrl || FALLBACK}
            alt={lead?.headline || "Prime Time tonight's lead story"}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6000ms] group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/90" />

          {/* Top-left branding */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight text-gradient-primary">GAINN</span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-[10px] font-mono font-semibold tracking-widest text-primary uppercase">
              <Clapperboard className="w-3 h-3" /> Prime Time Studio
            </span>
          </div>

          {/* Centered play */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/40 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="w-7 h-7 md:w-8 md:h-8 text-white fill-white ml-1" />
            </span>
          </span>

          {/* Headline block */}
          <div className="absolute left-4 md:left-8 bottom-14 md:bottom-16 max-w-xl border-l-[3px] border-primary pl-4">
            <h2 className="font-display font-bold leading-none text-[34px] md:text-[48px] text-white [text-shadow:0_0_28px_hsl(var(--primary)/0.55)]">
              Prime <span className="text-primary">Time</span>
            </h2>
            <p className="mt-2 text-xs md:text-sm text-white/80">
              GAINN's flagship AI-narrated news presentation — real stories, real images, real insights.
            </p>
          </div>

          {/* Breaking ticker pinned to bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-9 bg-gainn-red/20 border-t border-gainn-red/40 backdrop-blur-sm flex items-center overflow-hidden">
            <span className="flex-shrink-0 h-full px-3 flex items-center bg-gainn-red text-white text-[10px] font-mono font-bold tracking-widest">
              BREAKING
            </span>
            <div className="ticker-wrap flex-1 h-full flex items-center">
              <div className="ticker-content">
                {[...ticker, ...ticker].map((t, i) => (
                  <span key={i} className="inline-flex items-center px-6 text-[11px] font-mono text-white/85">
                    {t}<span className="ml-6 text-primary/50">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* CTA row */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            to="/prime-time"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gainn-red text-white text-sm font-bold hover:brightness-110 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-white" /> Start Prime Time
          </Link>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute Prime Time" : "Mute Prime Time"}
            className="p-2.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="ml-1 text-[10px] font-mono text-muted-foreground hidden sm:inline">
            AI-narrated · AI-verified · no anchors, no bias
          </span>
        </div>
      </div>

      {/* ── Tonight's Rundown ── */}
      <aside className="card-glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">Tonight's Rundown</span>
          <span className="text-[10px] font-mono text-gainn-red">● LIVE 9PM ET</span>
        </div>
        <div className="p-2 space-y-1">
          {rundown.map((a) => (
            <Link
              key={a.id}
              to={`/shorts/${a.id}`}
              className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition group"
            >
              <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 bg-surface-1">
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase">
                  {a.category}
                </span>
                <p className="text-xs font-semibold leading-snug line-clamp-2 text-foreground">
                  {a.headline}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-primary" /> Every story AI-verified before air
        </div>
      </aside>
    </section>
  );
};
