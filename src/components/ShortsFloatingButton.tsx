import { Link, useLocation } from "react-router-dom";
import { Play } from "lucide-react";

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
      aria-label="Open GAINN Shorts"
      className="fixed z-40 bottom-5 right-4 md:bottom-6 md:right-6 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-accent-foreground bg-accent border border-accent/40 shadow-lg hover:opacity-90 transition-opacity"
    >
      <Play className="w-4 h-4 fill-current" />
      Shorts
    </Link>
  );
}