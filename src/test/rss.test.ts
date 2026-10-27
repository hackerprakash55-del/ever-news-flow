import { describe, it, expect } from "vitest";
import { parseRssItems, rssText, rssLink, rssImage, rssDate } from "../../supabase/functions/fetch-news/rss";

describe("server RSS parsing", () => {
  it.each(["Times of India", "The Hindu", "NDTV"])("reads %s RSS without browser globals", (source) => {
    const [item] = parseRssItems(`<rss><channel><item><title><![CDATA[India & its latest news]]></title><link>https://example.org/story</link><source url="https://example.org">${source}</source><description><![CDATA[News summary]]></description><media:content url="https://example.org/image.jpg"/><pubDate>Tue, 27 Oct 2026 08:00:00 GMT</pubDate></item></channel></rss>`);
    expect(rssText(item?.title)).toBe("India & its latest news");
    expect(rssText(item?.source)).toBe(source);
    if (!item) throw new Error("Missing RSS item");
    expect(rssLink(item)).toBe("https://example.org/story");
    expect(rssImage(item)).toBe("https://example.org/image.jpg");
  });
  it("reads a single Google News item and encoded title", () => {
    const items = parseRssItems('<rss><channel><item><title>India &amp; news - Outlet</title><link>https://news.google.com/rss/articles/123</link><source url="https://example.org">Outlet</source></item></channel></rss>');
    expect(items).toHaveLength(1);
    expect(rssText(items[0]?.title)).toBe("India & news - Outlet");
  });
  it("reads Atom alternate links and multiple entries", () => {
    const items = parseRssItems('<feed><entry><title>One</title><link rel="self" href="https://example.org/feed"/><link rel="alternate" href="https://example.org/one"/></entry><entry><title>Two</title></entry></feed>');
    expect(items).toHaveLength(2);
    expect(rssLink(items[0])).toBe("https://example.org/one");
  });
  it("rejects malformed XML and tolerates invalid dates", () => {
    expect(parseRssItems("<rss><channel>")).toEqual([]);
    expect(Number.isNaN(new Date(rssDate("invalid date")).getTime())).toBe(false);
  });
});