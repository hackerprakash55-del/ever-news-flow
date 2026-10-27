import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), session: vi.fn(), read: vi.fn(), notice: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.session }, functions: { invoke: mocks.invoke } } }));
vi.mock("@/lib/published-translation", () => ({ readPublishedTranslations: mocks.read }));
vi.mock("sonner", () => ({ toast: { info: mocks.notice } }));
import { translateTexts } from "@/lib/language";

describe("public translation access", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ data: { session: null } }); });
  it("lets signed-out readers read published Hindi without generation", async () => {
    mocks.read.mockResolvedValue(["भारत समाचार"]);
    expect(await translateTexts(["India news"], "hi-IN")).toEqual(["भारत समाचार"]);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("does not generate missing translations for signed-out readers", async () => {
    mocks.read.mockResolvedValue([null]);
    expect(await translateTexts(["Unpublished text"], "hi-IN")).toEqual(["Unpublished text"]);
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.notice).toHaveBeenCalled();
  });
  it("keeps signed-in on-demand generation available", async () => {
    mocks.read.mockResolvedValue([null]);
    mocks.session.mockResolvedValue({ data: { session: { user: { id: "test" } } } });
    mocks.invoke.mockResolvedValue({ data: { translations: ["भारत समाचार"] }, error: null });
    expect(await translateTexts(["India news"], "hi-IN")).toEqual(["भारत समाचार"]);
    expect(mocks.invoke).toHaveBeenCalledWith("sarvam-translate", { body: { texts: ["India news"], target: "hi-IN" } });
  });
});