import { useState, useEffect, useRef, useMemo } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { HeroArticleCard, ArticleCard, ArticleListItem } from "@/components/ArticleCards";
import { ShortsPreviewStrip } from "@/components/ShortsPreviewStrip";
import { PrimeTimeHero } from "@/components/PrimeTimeHero";
import { TrendingVideosSection } from "@/components/TrendingVideosSection";
import { JustInFeed } from "@/components/JustInFeed";
import { HeroGridSkeleton, SmallGridSkeleton, ListItemSkeleton } from "@/components/ArticleSkeletons";
import { useNews } from "@/hooks/useNews";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RefreshCw, TrendingUp, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoFilter, GeoSelection, geoToQuery } from "@/components/GeoFilter";

const FEED_TABS = [
  { id: "top", label: "Top Stories", icon: TrendingUp },
  { id: "just-in", label: "Just In", icon: Zap },
];

// ── Footer ─────────────────────────────────────────────────
const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Top Stories", href: "/" },
      { label: "Prime Time", href: "/prime-time" },
      { label: "Shorts", href: "/shorts" },
      { label: "Video Library", href: "/videos" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Newsroom", href: "/newsroom" },
      { label: "How we verify", href: "/newsroom" },
      { label: "Coverage", href: "/trending" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Editorial standards", href: "/" },
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Newsletter", href: "/settings" },
      { label: "Account", href: "/settings" },
      { label: "Contact", href: "/settings" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_repeat(4,1fr)] gap-10">
          <div className="max-w-sm">
            <div className="text-base font-display font-semibold text-foreground mb-2">
              GAINN — Global AI Intelligence &amp; News Network
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Neutral, source-checked reporting. Every story is AI-verified against primary
              sources and published without editorial spin.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/80 mb-3">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">© 2026 GAINN. All rights reserved.</span>
          <span className="text-[11px] font-mono text-muted-foreground/50">24/7 autonomous newsroom</span>
        </div>
      </div>
    </footer>
  );
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const feedRef = useRef<HTMLDivElement>(null);

  const catFromUrl = searchParams.get("cat") ?? "All";
  const [activeCategory, setActiveCategory] = useState(catFromUrl);
  const [geo, setGeo] = useState<GeoSelection>({ country: "India", state: null, city: null });
  const [feedTab, setFeedTab] = useState("top");
  const [moreCount, setMoreCount] = useState(6); // Load More pagination

  useEffect(() => { setActiveCategory(searchParams.get("cat") ?? "All"); }, [searchParams]);

  const newsCategory = activeCategory === "All" ? "all" : activeCategory;
  const location = geoToQuery(geo) || "India";
  const { articles, isLive, isLoading, refresh } = useNews({ category: newsCategory, pageSize: 30, location });

  const displayArticles = articles;
  const hasBreaking = displayArticles.some((a) => a.isBreaking);

  // Derive trending category from top articles
  const trendingCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    displayArticles.slice(0, 10).forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
    let best = "Technology";
    let max = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > max) { max = count; best = cat; }
    }
    return best;
  }, [displayArticles]);

  // Section slicing
  const heroArticle = displayArticles[0];
  const heroSide = displayArticles.slice(1, 3);
  const mustRead = displayArticles.slice(3, 6);
  const categoryDiveArticles = displayArticles.filter(a => a.category === trendingCategory && !displayArticles.slice(0, 6).includes(a)).slice(0, 4);
  const usedIds = new Set([
    ...displayArticles.slice(0, 6).map(a => a.id),
    ...categoryDiveArticles.map(a => a.id),
  ]);
  const remainingArticles = displayArticles.filter(a => !usedIds.has(a.id));
  // Pick a radar article — first breaking from remaining, or first with a non-Global region
  const radarArticle = remainingArticles.find(a => a.isBreaking) || remainingArticles.find(a => a.region && a.region !== "Global") || remainingArticles[0];
  const radarId = radarArticle?.id;
  const morePool = remainingArticles.filter(a => a.id !== radarId);
  const moreVisible = morePool.slice(0, moreCount);
  const hasMoreToLoad = morePool.length > moreCount;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="GAINN — Global AI News Network"
        description="Autonomous AI news agency delivering verified breaking stories, multi-agent reporting, and live video briefings 24/7 from around the world."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GAINN — Global AI News Network",
          url: "https://ever-news-flow.lovable.app/",
        }}
      />
      <div className="ambient-orbs" aria-hidden="true"><span /></div>
      <div className="load-nav">
        <GlobalHeader onNewsroomClick={() => navigate("/newsroom")} onCategoryChange={setActiveCategory} activeCategory={activeCategory} />
      </div>
      {/* One moving band only: urgent banner when breaking, otherwise the ticker */}
      {!hasBreaking && (
        <div className="load-ticker">
          <NewsTickerBar />
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-10 space-y-14">
        <h1 className="sr-only">GAINN — Global AI News Network: autonomous, verified, real-time</h1>

        {hasBreaking && <BreakingNewsBanner />}

        <PrimeTimeHero />

        {/* ── Combined filter + feed tabs row ── */}
        <div ref={feedRef}>
          <div className="flex items-center gap-2 border-b border-border pb-0 -mb-3 flex-wrap">
            <GeoFilter value={geo} onChange={setGeo} />
            <Button variant="ghost" size="icon"
              className={`h-7 w-7 text-muted-foreground hover:text-foreground ${isLoading ? "animate-spin" : ""}`}
              onClick={refresh} disabled={isLoading} aria-label="Refresh stories">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
            {FEED_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => { setFeedTab(tab.id); setMoreCount(6); }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
                    feedTab === tab.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            EDITORIAL FEED SECTIONS
            ════════════════════════════════════════════════════ */}

        {feedTab === "just-in" ? (
          <JustInFeed />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-10">
            <div className="space-y-16">

              {/* ── SECTION 1: HERO ── */}
              {isLoading ? <HeroGridSkeleton /> : heroArticle && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><HeroArticleCard article={heroArticle} /></div>
                  <div className="space-y-4">
                    {heroSide.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              )}

              {/* ── SHORTS (below the lead story) ── */}
              <ShortsPreviewStrip />

              {/* ── SECTION 2: MUST READ (3 articles) ── */}
              {!isLoading && mustRead.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 mb-5">Must read</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {mustRead.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              )}

              {/* ── SECTION 3: VIDEO BREAK ── */}
              <TrendingVideosSection />

              {/* ── SECTION 4: CATEGORY DEEP DIVE ── */}
              {!isLoading && categoryDiveArticles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                      Top in {trendingCategory} Today
                    </h2>
                    <span className="ml-auto text-[11px] font-mono text-muted-foreground/60">{categoryDiveArticles.length} stories</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryDiveArticles.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              )}

              {/* ── SECTION 7: MORE HEADLINES (paginated 6) ── */}
              {!isLoading && moreVisible.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">More headlines</h2>
                    <span className="ml-auto text-[11px] font-mono text-muted-foreground/60">
                      {Math.min(moreCount, morePool.length)} of {morePool.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moreVisible.map((a) => (
                      <div key={a.id} className="animate-fade-in">
                        <ArticleCard article={a} isPremium={false} />
                      </div>
                    ))}
                  </div>
                  {hasMoreToLoad && (
                    <div className="text-center mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setMoreCount(c => c + 6)}
                        className="px-8 text-sm gap-2"
                      >
                        Load more stories <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && displayArticles.length > 0 && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground/60">
                    {displayArticles.length} stories{location ? ` · ${location}` : ""}
                    {!isLive && " · Showing recent stories"}
                  </span>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div className="space-y-4">
              <div className="card-glass rounded-lg overflow-hidden xl:sticky xl:top-24">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">Trending now</span>
                </div>
                <div className="p-2">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
                    : displayArticles.slice(0, 8).map((a, i) => <ArticleListItem key={a.id} article={a} index={i} />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
