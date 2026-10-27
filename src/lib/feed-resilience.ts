export const NEWS_REFRESH_MS = 5 * 60 * 1000;

/** Empty refreshes must not erase the last readable feed. */
export function preserveNonemptyFeed<T extends { articles: unknown[] }>(next: T, previous?: T): T {
  if (next.articles.length || !previous?.articles.length) return next;
  return { ...previous, isLive: false, isCached: true, isFallback: true,
    notice: "Live feed unavailable, showing latest saved stories." };
}