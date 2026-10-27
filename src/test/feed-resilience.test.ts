import { describe, expect, it } from "vitest";
import { NEWS_REFRESH_MS, preserveNonemptyFeed } from "../lib/feed-resilience";

describe("Hindi feed resilience", () => {
  it("refreshes every five minutes", () => expect(NEWS_REFRESH_MS).toBe(300000));
  it("retains Hindi stories on an empty refresh", () => {
    expect(preserveNonemptyFeed({ articles: [] }, { articles: [{ headline: "भारत की खबर" }] }).articles)
      .toEqual([{ headline: "भारत की खबर" }]);
  });
  it("accepts new nonempty stories", () => {
    expect(preserveNonemptyFeed({ articles: ["नई खबर"] }, { articles: ["पुरानी खबर"] }).articles).toEqual(["नई खबर"]);
  });
});