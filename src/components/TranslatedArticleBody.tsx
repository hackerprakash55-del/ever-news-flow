import { useEffect, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { useLanguage, translateTexts, LANGUAGES } from "@/lib/language";

interface Props {
  headline: string;
  summary: string;
  paragraphs: string[];
}

/**
 * Renders the article headline, standfirst and body, translated on the fly into
 * the reader's chosen Indian language (Sarvam). Falls back to English silently.
 */
export const TranslatedArticleBody = ({ headline, summary, paragraphs }: Props) => {
  const [lang] = useLanguage();
  const [translated, setTranslated] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const source = [headline, summary, ...paragraphs];

  useEffect(() => {
    let cancelled = false;
    if (lang === "en-IN") {
      setTranslated(null);
      return;
    }
    setLoading(true);
    translateTexts(source, lang)
      .then((out) => { if (!cancelled) setTranslated(out); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, headline, summary, paragraphs.length]);

  const text = translated ?? source;
  const langLabel = LANGUAGES.find((l) => l.code === lang)?.native;

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-display text-foreground leading-tight mb-4">
        {text[0]}
      </h1>

      {lang !== "en-IN" && (
        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-muted-foreground">
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Translating to {langLabel}…</>
            : <><Languages className="w-3.5 h-3.5 text-primary" /> AI translation · {langLabel}</>}
        </div>
      )}

      <p className="text-base text-muted-foreground mb-6 italic border-l-2 border-primary pl-4">
        {text[1]}
      </p>

      <div className="article-body">
        {text.length > 2
          ? text.slice(2).map((para, i) => <p key={i}>{para}</p>)
          : <p className="text-muted-foreground">{text[1]}</p>}
      </div>
    </>
  );
};
