import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn() }, functions: { invoke: vi.fn() }, from: vi.fn() } }));
import { isAlreadyInLanguage, translateTexts } from "@/lib/language";
describe("native Hindi text", () => {
  it("detects Hindi", () => {
    expect(isAlreadyInLanguage("भारत में बारिश", "hi-IN")).toBe(true);
    expect(isAlreadyInLanguage("Rain in India", "hi-IN")).toBe(false);
  });
  it("returns Hindi text without any lookup", async () => {
    expect(await translateTexts(["भारत में बारिश"], "hi-IN")).toEqual(["भारत में बारिश"]);
  });
});
