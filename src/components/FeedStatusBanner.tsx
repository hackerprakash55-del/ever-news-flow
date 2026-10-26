import { AlertTriangle, Clock, Database } from "lucide-react";

interface FeedStatusBannerProps {
  isFallback: boolean;
  isCached: boolean;
  notice: string | null;
  isLoading?: boolean;
  hasArticles?: boolean;
}

export function FeedStatusBanner({ isFallback, isCached, notice, isLoading, hasArticles }: FeedStatusBannerProps) {
  // Nothing to show while the first fetch is still running
  if (isLoading) return null;

  // Don't show anything if feed is live and healthy
  if (!isFallback && !isCached) {
    return null;
  }

  // Determine the type of fallback state
  const isStaleCache = isCached && notice?.includes("cached");

  // Content is on screen — use a quiet notice, never an alarming banner.
  if (isStaleCache || (isFallback && hasArticles)) {
    return (
      <div className="w-full bg-blue-500/15 border-y border-blue-500/30 px-4 py-2.5">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-200 font-medium">
            Showing recent stories — live feed temporarily unavailable
          </p>
          <span className="ml-auto text-xs text-blue-300/70">
            Stories may be outdated
          </span>
        </div>
      </div>
    );
  }

  // No content at all — this is the only time the strong banner appears
  return (
    <div className="w-full bg-slate-500/15 border-y border-slate-500/30 px-4 py-2.5">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <p className="text-sm text-slate-200 font-medium">
          {notice || "Live feed unavailable"}
        </p>
      </div>
    </div>
  );
}
