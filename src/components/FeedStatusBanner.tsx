import { AlertTriangle, Clock, Database } from "lucide-react";

interface FeedStatusBannerProps {
  isFallback: boolean;
  isCached: boolean;
  notice: string | null;
}

export function FeedStatusBanner({ isFallback, isCached, notice }: FeedStatusBannerProps) {
  // Don't show anything if feed is live and healthy
  if (!isFallback && !isCached) {
    return null;
  }

  // Determine the type of fallback state
  const isMockData = isFallback && !isCached;
  const isStaleCache = isCached && notice?.includes("cached");

  if (isMockData) {
    // MOCK_ARTICLES are being shown - this should ideally only happen in dev
    return (
      <div className="w-full bg-amber-500/15 border-y border-amber-500/30 px-4 py-2.5">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-200 font-medium">
            Showing demo content — live news feed unavailable
          </p>
          <span className="ml-auto text-xs text-amber-300/70">
            These stories are placeholders, not real news
          </span>
        </div>
      </div>
    );
  }

  if (isStaleCache) {
    // Showing cached/stale data from localStorage or edge cache
    return (
      <div className="w-full bg-blue-500/15 border-y border-blue-500/30 px-4 py-2.5">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-200 font-medium">
            Showing cached stories — live feed temporarily unavailable
          </p>
          <span className="ml-auto text-xs text-blue-300/70">
            Stories may be outdated
          </span>
        </div>
      </div>
    );
  }

  // Generic fallback state
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
