import { Users, Star } from "lucide-react";

const LOGOS = ["REUTERS", "BLOOMBERG", "ASSOCIATED PRESS", "FT", "WSJ", "AXIOS"];

export function SocialProofStrip() {
  return (
    <div className="card-glass rounded-xl px-5 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-5 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-semibold">14,287</span> readers today
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-primary" fill="currentColor" />
            <span className="text-foreground font-semibold">4.9</span> / 5 trust score
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          {LOGOS.map((l) => (
            <span
              key={l}
              className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}