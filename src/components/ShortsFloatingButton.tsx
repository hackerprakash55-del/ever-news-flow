import { Link, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";

/**
 * Fixed floating CTA for /shorts. Rendered globally in App.tsx and hides
 * itself on the shorts page. Sits above the bottom nav hint on mobile.
 */
export function ShortsFloatingButton() {
  const location = useLocation();
  if (location.pathname.startsWith("/shorts")) return null;

  return (
    <Link
      to="/shorts"
      aria-label="Open GAINN AI Shorts"
      className="fixed z-40 bottom-5 right-4 md:bottom-6 md:right-6 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-cyan-500 to-cyan-600 border border-cyan-300/50 shadow-[0_0_32px_rgba(0,212,255,0.45),0_10px_24px_rgba(0,0,0,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-transform"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <Zap className="w-4 h-4" />
      AI Shorts
      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] font-bold tracking-wider">LIVE</span>
    </Link>
  );
}