import { describe, it, expect } from "vitest";
import { LOCAL_PLACES, ALERT_TOPICS, findPlace, whatsappShareUrl } from "@/data/localPages";

describe("local and alert pages", () => {
  it("has 60 unique city pages", () => {
    expect(new Set(LOCAL_PLACES.map((p) => p.slug)).size).toBe(60);
  });
  it("resolves city slugs", () => {
    expect(findPlace("varanasi")?.hindi).toBe("वाराणसी");
    expect(findPlace("nowhere")).toBeUndefined();
  });
  it("has 8 alert topics", () => {
    expect(ALERT_TOPICS).toHaveLength(8);
  });
  it("builds a WhatsApp link containing the story URL", () => {
    expect(whatsappShareUrl("Hi", "https://x.test/a")).toBe("https://wa.me/?text=Hi%0A%0Ahttps%3A%2F%2Fx.test%2Fa");
  });
});

import { matchesKeywords } from "@/data/localPages";
describe("topic filtering", () => {
  it("drops stories that don't mention the topic", () => {
    expect(matchesKeywords({ headline: "SSC recruitment 2026 notification out" }, ["recruitment"])).toBe(true);
    expect(matchesKeywords({ headline: "Intel layoffs" }, ["recruitment"])).toBe(false);
  });
});
