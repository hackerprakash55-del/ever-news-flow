/** Missing narration must stop publication, never turn into a silent Short. */
export async function generateShortsNarration(
  text: string,
  language: string,
  apiKey: string | undefined,
  request: typeof fetch = fetch,
): Promise<string> {
  if (!apiKey) throw new Error("Shorts narration is not configured; upload stopped.");
  const response = await request("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 1400), target_language_code: language, speaker: "shubh", model: "bulbul:v3" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Shorts narration failed (HTTP ${response.status}); upload stopped.`);
  const data = await response.json();
  const audio = data?.audios?.[0];
  if (typeof audio !== "string" || !audio.trim()) {
    throw new Error("Narration service returned no audio; upload stopped.");
  }
  return audio;
}