// Source trust scoring math (Wilson-ish blend of accuracy + recency).
export function blendReliability(
  prev: number,
  outcome: "verified" | "refuted" | "neutral",
  weight = 0.05,
): number {
  const target = outcome === "verified" ? 1 : outcome === "refuted" ? 0 : 0.5;
  return Math.max(0, Math.min(1, prev * (1 - weight) + target * weight));
}

export function aggregateConsensus(votes: number[]): number {
  if (!votes.length) return 0;
  const mean = votes.reduce((a, b) => a + b, 0) / votes.length;
  const variance =
    votes.reduce((a, b) => a + (b - mean) ** 2, 0) / votes.length;
  // High mean + low variance = high consensus
  return Math.max(0, Math.min(1, mean * (1 - Math.sqrt(variance))));
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
