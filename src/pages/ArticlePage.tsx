import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MOCK_ARTICLES, Article } from "@/data/mockData";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { Shield, Clock, Globe, Tag, CheckCircle, ArrowLeft, Share2, Bookmark, BookmarkCheck, ChevronRight, ExternalLink, MapPin, Layers, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useNews";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CredibilityMeter = ({ score }: { score: number }) => {
  const segments = 10;
  const filled = Math.round((score / 100) * segments);
  const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm transition-all"
            style={{ background: i < filled ? color : "hsl(var(--surface-3))" }}
          />
        ))}
      </div>
      <span className="text-sm font-bold font-mono" style={{ color }}>{score}%</span>
    </div>
  );
};

// Pull the article from react-query cache (set by useNews) or mock data
function useArticle(id: string): Article | null {
  // Check all cached news queries for this article
  const { data } = useQuery({
    queryKey: ["article-lookup", id],
    queryFn: () => {
      // First try mock data
      const mock = MOCK_ARTICLES.find((a) => a.id === id);
      if (mock) return mock;
      return null;
    },
    staleTime: Infinity,
  });

  return data ?? null;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // First try article passed via navigation state (from AI Anchor Panel / live feed)
  let article: Article | null = (location.state as any)?.article ?? null;

  // Then try mock data
  if (!article) article = MOCK_ARTICLES.find((a) => a.id === id) ?? null;

  // Then try sessionStorage for previously stored live articles
  if (!article && id) {
    try {
      const stored = sessionStorage.getItem(`article-${id}`);
      if (stored) article = JSON.parse(stored);
    } catch {}
  }

  // Fetch live news for related articles across all categories
  const { articles: liveArticles } = useNews({ category: "all", pageSize: 20 });

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <NewsTickerBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-display mb-2">Article not found</h1>
            <p className="text-muted-foreground text-sm">This article may have expired from the live feed.</p>
            <Button variant="outline" onClick={() => navigate("/")}>← Back to GAINN</Button>
          </div>
        </div>
      </div>
    );
  }

  // Related: same category + region match (all sources: mock + live)
  const allArticles = [...MOCK_ARTICLES, ...liveArticles.filter((a) => !MOCK_ARTICLES.find((m) => m.id === a.id))];
  const sameCategory = allArticles.filter((a) => a.id !== article!.id && a.category === article!.category).slice(0, 3);
  const sameRegion = allArticles.filter((a) => a.id !== article!.id && a.region && article!.region && a.region !== "Global" && a.region === article!.region && a.category !== article!.category).slice(0, 2);
  const breaking = allArticles.filter((a) => a.id !== article!.id && a.isBreaking && a.category !== article!.category).slice(0, 2);
  
  const biasLabel = Math.abs(article.biasScore) < 0.1 ? "Neutral" : article.biasScore > 0 ? "Slight Right" : "Slight Left";
  const isLiveArticle = article.id.startsWith("live-");
  const paragraphs = article.body ? article.body.split("\n\n").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <NewsTickerBar />

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span>{article.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-xs">{article.headline}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
          {/* Article body */}
          <div>
            {/* Hero image */}
            {article.imageUrl && (
              <div className="relative rounded-xl overflow-hidden mb-6" style={{ height: 380 }}>
                <img
                  src={article.imageUrl}
                  alt={article.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                {article.isBreaking && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-gainn-red text-white text-xs font-bold rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
                    BREAKING NEWS
                  </div>
                )}
                {isLiveArticle && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-gainn-green/90 text-white text-[10px] font-bold rounded-md font-mono">
                    LIVE SOURCE
                  </div>
                )}
              </div>
            )}

            {/* Category + tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded border text-xs font-mono font-bold text-gainn-cyan border-gainn-cyan/30 bg-gainn-cyan/10">
                {article.category}
              </span>
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-surface-2 text-muted-foreground">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl font-display text-foreground leading-tight mb-4">
              {article.headline}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <span className={`flex items-center gap-1.5 font-mono text-xs ${isLiveArticle ? "text-gainn-green" : "text-gainn-cyan"}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                {isLiveArticle ? "Live News" : "AI Generated & Verified"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(article.publishedAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {article.readTime} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {article.region}
              </span>
            </div>

            {/* Summary */}
            <p className="text-base text-muted-foreground mb-6 italic border-l-2 border-gainn-blue pl-4">
              {article.summary}
            </p>

            {/* Article body */}
            <div className="article-body">
              {paragraphs.length > 0
                ? paragraphs.map((para, i) => <p key={i}>{para}</p>)
                : <p className="text-muted-foreground">{article.summary}</p>
              }
            </div>

            {/* Live article — link to original */}
            {isLiveArticle && (article as any).url && (
              <div className="mt-6 p-4 rounded-lg border border-gainn-blue/30 bg-gainn-blue/5">
                <div className="flex items-center gap-2 text-sm text-gainn-cyan mb-1">
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-semibold">Read Full Story</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">This article is sourced from the original publisher. Click below to read the complete story.</p>
                <a
                  href={(article as any).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono text-gainn-blue hover:text-gainn-cyan transition-colors border border-gainn-blue/30 rounded px-3 py-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  {article.sources[0] || "Original Source"}
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Bookmark className="w-3.5 h-3.5" /> Save
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> All News
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* AI Fact Check Card */}
            <div className="card-glass rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gainn-blue" />
                <h3 className="text-sm font-semibold">AI Fact Check Report</h3>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Credibility Score</div>
                <CredibilityMeter score={article.credibilityScore} />
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Bias Analysis</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-surface-3 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border" />
                    <div
                      className="absolute inset-y-0 w-3 h-2 rounded-full bg-gainn-cyan transform -translate-x-1/2"
                      style={{ left: `${50 + article.biasScore * 50}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gainn-cyan">{biasLabel}</span>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                  <span>Left</span><span>Neutral</span><span>Right</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Sources</div>
                <div className="space-y-1.5">
                  {article.sources.map((src) => (
                    <div key={src} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-gainn-green flex-shrink-0" />
                      <span className="text-foreground">{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-surface-2 rounded p-2">
                    <div className="text-sm font-bold font-mono text-gainn-green">✓</div>
                    <div className="text-[10px] text-muted-foreground">Verified</div>
                  </div>
                  <div className="bg-surface-2 rounded p-2">
                    <div className="text-sm font-bold font-mono text-gainn-cyan">
                      {isLiveArticle ? "🌐" : "AI"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {isLiveArticle ? "Live Source" : "AI Authored"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related articles — same category */}
            {sameCategory.length > 0 && (
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-gainn-blue" />
                  <span className="text-sm font-semibold">Related Stories</span>
                  <span className="ml-auto text-[10px] font-mono text-gainn-cyan bg-gainn-blue/10 px-1.5 py-0.5 rounded">{article.category}</span>
                </div>
                <div className="p-3 space-y-3">
                  {sameCategory.map((a) => (
                    <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                      {a.imageUrl && (
                        <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-foreground group-hover:text-gainn-cyan transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                        <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m read</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Same region news */}
            {sameRegion.length > 0 && (
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gainn-green" />
                  <span className="text-sm font-semibold">More from {article.region?.split(",")[0]}</span>
                </div>
                <div className="p-3 space-y-3">
                  {sameRegion.map((a) => (
                    <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                      {a.imageUrl && (
                        <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground group-hover:text-gainn-green transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-surface-2 text-muted-foreground">{a.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Breaking news from other categories */}
            {breaking.length > 0 && (
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-gainn-red" />
                  <span className="text-sm font-semibold">Breaking Now</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-gainn-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-gainn-red animate-pulse" /> Live
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  {breaking.map((a) => (
                    <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                      {a.imageUrl && (
                        <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground group-hover:text-gainn-red transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-gainn-red/10 text-gainn-red border border-gainn-red/20">{a.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
