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
  RefreshCw, Wifi, WifiOff, AlertCircle, MapPin, TrendingUp, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoFilter, GeoSelection, geoToQuery } from "@/components/GeoFilter";

const LiveBadge = ({ isLive, fetchedAt }: { isLive: boolean; fetchedAt: string | null }) => (
  <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
    isLive ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10" : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
  }`}>
    {isLive ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Demo</>}
    {fetchedAt && <span className="opacity-60 ml-1">{new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
  </div>
);

const FEED_TABS = [
  { id: "top", label: "Top Stories", icon: TrendingUp },
  { id: "just-in", label: "Just In", icon: Zap },
];

// ── Footer ─────────────────────────────────────────────────
function SystemFooter({ isLive }: { isLive: boolean }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <footer className="border-t border-border mt-12">
      <div className="border-b border-border bg-surface-1 px-4 md:px-6 py-2">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gainn-green live-dot" />
              <span className="text-gainn-green font-semibold">ALL SYSTEMS OPERATIONAL</span>
            </div>
            <span className="text-border hidden md:inline">|</span>
            <span className="hidden md:inline">Ingestion: <span className="text-gainn-green">●</span></span>
            <span className="hidden md:inline">Verification: <span className="text-gainn-green">●</span></span>
            <span className="hidden md:inline">Generation: <span className="text-gainn-green">●</span></span>
            <span className="hidden md:inline">Distribution: <span className="text-gainn-green">●</span></span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {time.toLocaleTimeString("en-US", { hour12: false })} UTC
          </div>
        </div>
      </div>
      <div className="py-8 px-4 md:px-6">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-lg font-bold text-gradient-primary font-display mb-1">GAINN</div>
              <div className="text-xs text-muted-foreground font-mono">Global AI News Network — Autonomous Intelligence</div>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
              <span>{isLive ? "Live news via NewsAPI" : "Demo mode"}</span>
              <span className="text-border">|</span>
              <span>108 agents</span>
              <span className="text-border">|</span>
              <span>34 countries</span>
              <span className="text-border">|</span>
              <span>24/7 operation</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">
              © 2026 GAINN. Powered by multi-agent AI architecture. Zero human editorial intervention.
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              Built for autonomous intelligence at scale.
            </span>
          </div>
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
  const { articles, isLive, isLoading, isError, error, fetchedAt, refresh } = useNews({ category: newsCategory, pageSize: 30, location });

  const displayArticles = articles;

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
      <div className="load-ticker">
        <NewsTickerBar />
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <h1 className="sr-only">GAINN — Global AI News Network: autonomous, verified, real-time</h1>

        <BreakingNewsBanner />

        <PrimeTimeHero />

        <ShortsPreviewStrip />

        {/* ── Combined filter + feed tabs row ── */}
        <div ref={feedRef}>
          {isError && error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive mb-3">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Live feed unavailable ({error}) — showing demo articles. <button onClick={refresh} className="underline">Retry</button></span>
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-border pb-0 -mb-3 flex-wrap">
            <GeoFilter value={geo} onChange={setGeo} />
            <LiveBadge isLive={isLive} fetchedAt={fetchedAt} />
            <Button variant="ghost" size="icon"
              className={`h-7 w-7 text-muted-foreground hover:text-foreground ${isLoading ? "animate-spin" : ""}`}
              onClick={refresh} disabled={isLoading}>
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
                  {tab.id === "just-in" && isLive && <span className="w-1.5 h-1.5 rounded-full bg-gainn-red live-dot" />}
                </button>
              );
            })}
          </div>

          {(geo.country || geo.state || geo.city) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono w-fit mt-4">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Showing news from:</span>
              {geo.country && <span className="text-accent font-semibold">{geo.country}</span>}
              {geo.state && <><span className="text-muted-foreground">›</span><span className="text-accent font-semibold">{geo.state}</span></>}
              {geo.city && <><span className="text-muted-foreground">›</span><span className="text-gainn-green font-semibold">{geo.city}</span></>}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            EDITORIAL FEED SECTIONS
            ════════════════════════════════════════════════════ */}

        {feedTab === "just-in" ? (
          <JustInFeed />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-8">

              {/* ── SECTION 1: HERO ── */}
              {isLoading ? <HeroGridSkeleton /> : heroArticle && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><HeroArticleCard article={heroArticle} /></div>
                  <div className="space-y-4">
                    {heroSide.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              )}

              {/* ── SECTION 2: MUST READ (3 articles) ── */}
              {!isLoading && mustRead.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-gainn-cyan" />
                    <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-gainn-cyan">Must Read Right Now</h2>
                  </div>
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
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-gainn-amber" />
                    <h2 className="text-sm font-semibold font-mono uppercase tracking-wider">
                      Top in {trendingCategory} Today
                    </h2>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{categoryDiveArticles.length} stories</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryDiveArticles.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              )}

              {/* ── SECTION 7: MORE HEADLINES (paginated 6) ── */}
              {!isLoading && moreVisible.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-muted-foreground">More Headlines</h2>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">
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
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setMoreCount(c => c + 6)}
                        className="px-8 text-sm font-mono gap-2"
                      >
                        Load More Stories <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && displayArticles.length > 0 && (
                <div className="text-center py-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {displayArticles.length} articles
                    {location && <> • <span className="text-accent">{location}</span></>}
                    {" "}• {isLive ? "Live from NewsAPI" : "Demo data"} •{" "}
                    <button onClick={refresh} className="text-primary hover:text-accent transition-colors">Refresh</button>
                  </span>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div className="space-y-4">
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Trending Now</span>
                  {isLive && <span className="text-[10px] font-mono text-gainn-green">● Live</span>}
                </div>
                <div className="p-2 space-y-1">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
                    : displayArticles.slice(0, 8).map((a, i) => <ArticleListItem key={a.id} article={a} index={i} />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SystemFooter isLive={isLive} />
    </div>
  );
};

export default Index;
