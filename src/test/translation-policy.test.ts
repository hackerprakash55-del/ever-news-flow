import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import { TRANSLATION_BATCH_SIZE, publishedTexts, textHash } from "../../supabase/functions/_shared/translation-policy";

describe("published translation policy", () => {
  it("caps each publication batch at 20 stories", () => {
    expect(TRANSLATION_BATCH_SIZE).toBe(20);
    expect(Array.from({ length: 30 }).slice(0, TRANSLATION_BATCH_SIZE)).toHaveLength(20);
  });
  it("reuses identical content and invalidates changed text", async () => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
    expect(await textHash("Same source text")).toBe(await textHash("Same source text"));
    expect(await textHash("Changed source text")).not.toBe(await textHash("Same source text"));
  });
  it("publishes only supplied headline, summary and body paragraphs", () => {
    expect(publishedTexts({ headline: "Headline", summary: "Summary", body: "First paragraph\n\nSecond paragraph" }))
      .toEqual(["Headline", "Summary", "First paragraph", "Second paragraph"]);
  });
});