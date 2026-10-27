import { describe, expect, it, vi } from "vitest";
import { prepareHindiShort } from "../../supabase/functions/_shared/hindi-shorts";

describe("Hindi Shorts translate before narration", () => {
  it("translates English title and script to Hindi", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ translated_text: "भारत की खबर" }));
    const result = await prepareHindiShort("India news", "Today's report", "test", request);
    expect(result).toEqual({ title: "भारत की खबर", script: "भारत की खबर", language: "hi-IN" });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("does not narrate untranslated English as Hindi", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ translated_text: "Still English" }));
    await expect(prepareHindiShort("English", "English story", "test", request)).rejects.toThrow("upload stopped");
  });
});