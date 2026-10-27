import { XMLParser, XMLValidator } from "npm:fast-xml-parser@5.3.0";

type XmlNode = Record<string, unknown>;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false });
const nodes = (value: unknown): XmlNode[] => (Array.isArray(value) ? value : value ? [value] : [])
  .filter((item): item is XmlNode => typeof item === "object" && item !== null);

export function rssText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null) return rssText((value as XmlNode)["#text"]);
  return "";
}

export function parseRssItems(xml: string): XmlNode[] {
  if (XMLValidator.validate(xml) !== true) return [];
  const doc = parser.parse(xml);
  return nodes(doc.rss?.channel?.item ?? doc.feed?.entry ?? doc["rdf:RDF"]?.item);
}

export function rssLink(item: XmlNode): string {
  if (typeof item.link === "string") return item.link.trim();
  const links = nodes(item.link);
  const link = links.find((node) => !node["@_rel"] || node["@_rel"] === "alternate");
  return rssText(link?.["@_href"]) || rssText(item.id);
}

export function rssImage(item: XmlNode): string | undefined {
  const media = nodes(item["media:content"])[0] ?? nodes(item["media:thumbnail"])[0];
  const enclosure = nodes(item.enclosure).find((node) => rssText(node["@_type"]).startsWith("image/"));
  return rssText(media?.["@_url"]) || rssText(enclosure?.["@_url"]) || undefined;
}

export function rssDate(value: string): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}