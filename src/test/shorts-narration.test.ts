import { describe, expect, it, vi } from "vitest";
import { generateShortsNarration } from "../../supabase/functions/_shared/shorts-narration";

describe("Shorts require narration before publication", () => {
  it("rejects missing voice configuration", async () => {
    await expect(generateShortsNarration("News", "en-IN", undefined)).rejects.toThrow("upload stopped");
  });
  it("rejects provider failures instead of returning silent audio", async () => {
    const request = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    await expect(generateShortsNarration("News", "en-IN", "test", request)).rejects.toThrow("HTTP 429");
  });
  it("rejects an empty audio response", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ audios: [] }));
    await expect(generateShortsNarration("News", "hi-IN", "test", request)).rejects.toThrow("no audio");
  });
  it("returns the generated narration", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ audios: ["d29ya2luZyBhdWRpbw=="] }));
    await expect(generateShortsNarration("News", "hi-IN", "test", request)).resolves.toBe("d29ya2luZyBhdWRpbw==");
  });
});