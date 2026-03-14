/**
 * Tracks reading progress for articles in localStorage.
 * Key: gainn_progress_<articleId>  → 0-100 (scroll %)
 * Key: gainn_read_<articleId>      → "true" when progress >= 90
 */

const KEY_PREFIX = "gainn_progress_";
const READ_PREFIX = "gainn_read_";

export function saveProgress(articleId: string, pct: number) {
  try {
    localStorage.setItem(KEY_PREFIX + articleId, String(Math.round(pct)));
    if (pct >= 90) localStorage.setItem(READ_PREFIX + articleId, "true");
  } catch {}
}

export function getProgress(articleId: string): number {
  try {
    return parseInt(localStorage.getItem(KEY_PREFIX + articleId) || "0", 10);
  } catch {
    return 0;
  }
}

export function isArticleRead(articleId: string): boolean {
  try {
    return localStorage.getItem(READ_PREFIX + articleId) === "true";
  } catch {
    return false;
  }
}
