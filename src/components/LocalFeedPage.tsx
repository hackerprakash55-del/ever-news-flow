import { Link, useNavigate } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { ArticleCard } from "@/components/ArticleCards";
import { HeroGridSkeleton } from "@/components/ArticleSkeletons";
import { useNews } from "@/hooks/useNews";
import { Button } from "@/components/ui/button";
import { matchesKeywords, whatsappShareUrl } from "@/data/localPages";
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";

interface Props {
  title: string;
  hindiTitle: string;
  description: string;
  path: string;
  location: string;
  q?: string;
  match?: string[]; // only show stories mentioning one of these words
  eyebrow: string;
  related: { label: string; href: string }[];
  relatedTitle: string;
}

export function LocalFeedPage({ title, hindiTitle, description, path, location, q, eyebrow, related, relatedTitle, match }: Props) {
  const navigate = useNavigate();
  const { articles: all, isLoading, refresh, fetchedAt } = useNews({ location, q, pageSize: 30 });
  const articles = match ? all.filter((a) => matchesKeywords(a, match)) : all;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const pageUrl = `https://ever-news-flow.lovable.app${path}`;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${title} — ${today} | GAINN`}
        description={description}
        path={path}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: pageUrl,
          inLanguage: ["en-IN", "hi-IN"],
        }}
      />
      <GlobalHeader onNewsroomClick={() => navigate("/newsroom")} />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-8">
        <header className="space-y-3 border-b border-border pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <p className="text-xs font-mono uppercase tracking-widest text-primary">{eyebrow} · {today}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">{title}</h1>
          <p className="text-xl text-muted-foreground" lang="hi">{hindiTitle}</p>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <a href={whatsappShareUrl(`${title} — GAINN`, pageUrl)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            {fetchedAt && (
              <span className="self-center text-xs font-mono text-muted-foreground">
                Updated {new Date(fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </header>

        {isLoading && articles.length === 0 ? (
          <HeroGridSkeleton />
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">No fresh reports yet. Check back shortly — this page refreshes every few minutes.</p>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
          </section>
        )}

        <nav aria-label={relatedTitle} className="border-t border-border pt-6">
          <h2 className="font-display text-xl font-semibold mb-3 text-foreground">{relatedTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.href} to={r.href} className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                {r.label}
              </Link>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
