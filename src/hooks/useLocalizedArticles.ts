import { useEffect, useMemo, useState } from "react";
import { useLanguage, translateTexts } from "@/lib/language";
import type { Article } from "@/data/mockData";

/** Persistent per-session cache so switching languages back and forth is instant. */
const cache = new Map<string, string>();
const key = (lang: string, id: string, field: "h" | "s") => `${lang}:${id}:${field}`;

function applyCache(articles: Article[], lang: string): Article[] {
  return articles.map((a) => {
    const h = cache.get(key(lang, a.id, "h"));
    const s = cache.get(key(lang, a.id, "s"));
    return h || s ? { ...a, headline: h || a.headline, summary: s || a.summary } : a;
  });
}

/**
 * Translates headlines and summaries of a feed into the reader's chosen
 * Indian language (Sarvam). English passes through untouched, and any
 * translation failure silently keeps the original text.
 */
export function useLocalizedArticles(articles: Article[], limit = 20): Article[] {
  const [lang] = useLanguage();
  const ids = useMemo(() => articles.map((a) => a.id).join(","), [articles]);
  const [out, setOut] = useState<Article[]>(articles);

  useEffect(() => {
    if (lang === "en-IN" || !articles.length) {
      setOut(articles);
      return;
    }
    let cancelled = false;
    setOut(applyCache(articles, lang));

    const missing = articles.slice(0, limit).filter((a) => !cache.has(key(lang, a.id, "h")));
    if (!missing.length) return;

    const texts = missing.flatMap((a) => [a.headline, a.summary || a.headline]);
    translateTexts(texts, lang).then((res) => {
      missing.forEach((a, i) => {
        cache.set(key(lang, a.id, "h"), res[i * 2] || a.headline);
        cache.set(key(lang, a.id, "s"), res[i * 2 + 1] || a.summary);
      });
      if (!cancelled) setOut(applyCache(articles, lang));
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, ids, limit]);

  return lang === "en-IN" ? articles : out;
}
