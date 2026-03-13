import { useState, useEffect, lazy, Suspense } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { BreakingNewsBanner, StatsBar } from "@/components/BreakingNewsBanner";
import { AIMorningBriefing } from "@/components/AIMorningBriefing";
import { HeroArticleCard, ArticleCard, ArticleListItem, SponsoredSlot } from "@/components/ArticleCards";
import { WorldNewsMap } from "@/components/WorldNewsMap";
import { AIAnchorPanel } from "@/components/AIAnchorPanel";
import { TrendingVideosSection } from "@/components/TrendingVideosSection";
import { TrendingTopicsSidebar } from "@/components/TrendingTopicsSidebar";
import { JustInFeed } from "@/components/JustInFeed";
import { NewsletterBanner } from "@/components/NewsletterBanner";
import { MarketTicker } from "@/components/MarketTicker";
import { HeroGridSkeleton, SmallGridSkeleton, ListItemSkeleton } from "@/components/ArticleSkeletons";
import { useNews } from "@/hooks/useNews";
import { CATEGORIES } from "@/data/mockData";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff, AlertCircle, MapPin, TrendingUp, Zap, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoFilter, GeoSelection, geoToQuery } from "@/components/GeoFilter";

// ── First-visit value prop banner ─────────────────────────
const BANNER_KEY = "gainn_banner_dismissed";

function ValuePropBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(BANNER_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(BANNER_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono"
      style={{ background: "hsl(222 28% 11%)", borderBottom: "1px solid hsl(var(--border))" }}
    >
      <span className="flex-1 text-center" style={{ color: "hsl(var(--accent))" }}>
        <span className="text-foreground/60 mr-1">✦</span>
        Real-time AI news from 12,891 verified sources — verified, unbiased, instant.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const SkeletonCard = () => (
  <div className="card-glass rounded-lg overflow-hidden h-48 shimmer-bg" />
);

const LiveBadge = ({ isLive, fetchedAt }: { isLive: boolean; fetchedAt: string | null }) => (
  <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
    isLive
      ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10"
      : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
  }`}>
    {isLive ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Demo</>}
    {fetchedAt && (
      <span className="opacity-60 ml-1">
        {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    )}
  </div>
);

// ── Feed mode tabs ─────────────────────────────────────────
const FEED_TABS = [
  { id: "top", label: "Top Stories", icon: TrendingUp },
  { id: "just-in", label: "Just In", icon: Zap },
  { id: "most-read", label: "Most Read Today", icon: Star },
  { id: "editors", label: "Editor's Pick", icon: Star },
];

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const catFromUrl = searchParams.get("cat") ?? "All";
  const [activeCategory, setActiveCategory] = useState(catFromUrl);
  const [geo, setGeo] = useState<GeoSelection>({ country: null, state: null, city: null });
  const [feedTab, setFeedTab] = useState("top");

  useEffect(() => {
    setActiveCategory(searchParams.get("cat") ?? "All");
  }, [searchParams]);

  const newsCategory = activeCategory === "All" ? "all" : activeCategory;
  const location = geoToQuery(geo);
  const { articles, isLive, isLoading, isError, error, fetchedAt, refresh } = useNews({
    category: newsCategory,
    pageSize: 20,
    location,
  });

  // Simulate most-read ordering (sort by credibility as proxy)
  const mostRead = [...articles].sort((a, b) => b.credibilityScore - a.credibilityScore);
  // Editor's picks — breaking or high-credibility
  const editorsPick = articles.filter((a) => a.isBreaking || a.credibilityScore >= 95).slice(0, 8);

  const displayArticles = feedTab === "most-read" ? mostRead
    : feedTab === "editors" ? (editorsPick.length > 0 ? editorsPick : articles)
    : articles;

  // Mark every 7th card as premium for demo
  const isPremium = (idx: number) => idx % 7 === 6;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader
        onNewsroomClick={() => navigate("/newsroom")}
        onCategoryChange={setActiveCategory}
        activeCategory={activeCategory}
      />
      <NewsTickerBar />
      <MarketTicker />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Breaking Banner */}
        <BreakingNewsBanner />

        {/* Animated Stats Strip */}
        <StatsBar />

        {/* AI Morning Briefing */}
        <AIMorningBriefing />

        {/* Geo Filter + status bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <GeoFilter value={geo} onChange={setGeo} />
            <LiveBadge isLive={isLive} fetchedAt={fetchedAt} />
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 text-muted-foreground hover:text-foreground ${isLoading ? "animate-spin" : ""}`}
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {(geo.country || geo.state || geo.city) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono w-fit">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Showing news from:</span>
              {geo.country && <span className="text-accent font-semibold">{geo.country}</span>}
              {geo.state && <><span className="text-muted-foreground">›</span><span className="text-accent font-semibold">{geo.state}</span></>}
              {geo.city && <><span className="text-muted-foreground">›</span><span className="text-gainn-green font-semibold">{geo.city}</span></>}
            </div>
          )}
        </div>

        {/* Error banner */}
        {isError && error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Live feed unavailable ({error}) — showing demo articles. <button onClick={refresh} className="underline">Retry</button></span>
          </div>
        )}

        {/* Feed mode tabs */}
        <div className="flex items-center gap-1 border-b border-border pb-0 -mb-3">
          {FEED_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFeedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
                  feedTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "just-in" && isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gainn-red live-dot" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Just In tab — show dedicated feed ── */}
        {feedTab === "just-in" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <JustInFeed />
            <div className="space-y-4">
              <TrendingTopicsSidebar onTagClick={(tag) => {}} />
              <AiCapabilitiesCard />
            </div>
          </div>
        ) : (
          /* ── Main grid ─────────────────────────────────────── */
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            {/* Left column */}
            <div className="space-y-6">

              {/* Bloomberg-style 3-col hero grid */}
              {isLoading ? (
                <HeroGridSkeleton />
              ) : displayArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Large hero — 2 cols */}
                  <div className="md:col-span-2">
                    <HeroArticleCard article={displayArticles[0]} />
                  </div>
                  {/* 2 medium stories — right column */}
                  <div className="space-y-4">
                    {displayArticles.slice(1, 3).map((a) => (
                      <ArticleCard key={a.id} article={a} isPremium={false} />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 4-article small grid */}
              {isLoading ? (
                <SmallGridSkeleton />
              ) : displayArticles.length >= 4 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayArticles.slice(3, 7).map((a, i) => (
                    <ArticleCard key={a.id} article={a} isPremium={isPremium(i + 3)} />
                  ))}
                </div>
              )}

              {/* AI Anchor */}
              <AIAnchorPanel />

              {/* Trending Videos */}
              <TrendingVideosSection />

              {/* World Map */}
              <WorldNewsMap />

              {/* More articles */}
              {!isLoading && displayArticles.length > 7 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-3">
                    More Stories —{" "}
                    {geo.city ?? geo.state ?? geo.country
                      ? `${geo.city ?? geo.state ?? geo.country} · ${activeCategory === "All" ? "All Topics" : activeCategory}`
                      : activeCategory === "All" ? "Top Headlines" : activeCategory}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayArticles.slice(7).map((a, i) => (
                      <ArticleCard key={a.id} article={a} isPremium={isPremium(i + 7)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Count indicator */}
              {!isLoading && displayArticles.length > 0 && (
                <div className="text-center py-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    {displayArticles.length} articles
                    {location && <> • <span className="text-accent">{location}</span></>}
                    {" "}• {isLive ? "Live from NewsAPI" : "Demo data"} •{" "}
                    <button onClick={refresh} className="text-primary hover:text-accent transition-colors">
                      Refresh
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Trending Now */}
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Trending Now</span>
                  {isLive && <span className="text-[10px] font-mono text-gainn-green">● Live</span>}
                </div>
                <div className="p-2 space-y-1">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
                    : displayArticles.slice(0, 8).map((a, i) => (
                        <ArticleListItem key={a.id} article={a} index={i} />
                      ))
                  }
                </div>
              </div>

              {/* Trending Topics pills */}
              <TrendingTopicsSidebar />

              {/* Sponsored slot */}
              <SponsoredSlot />

              {/* AI Capabilities */}
              <AiCapabilitiesCard />
            </div>
          </div>
        )}

        {/* Newsletter Banner — above footer */}
        <NewsletterBanner />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8 px-4 md:px-6">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-mono">
            © 2026 GAINN — Global AI News Network. Powered by 100+ autonomous AI agents.
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{isLive ? "Live news via NewsAPI" : "Demo mode"}</span>
            <span className="text-border">|</span>
            <span className="text-gainn-green">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── AI Capabilities Card (extracted) ─────────────────────
const AiCapabilitiesCard = () => (
  <div className="card-glass rounded-lg p-4">
    <h4 className="text-sm font-semibold mb-3 text-accent">AI Capabilities</h4>
    <div className="space-y-2">
      {[
        { label: "Fake News Detection", pct: 98 },
        { label: "Bias Neutralization", pct: 94 },
        { label: "Source Reliability", pct: 97 },
        { label: "Multilingual (52 langs)", pct: 99 },
        { label: "Real-time Processing", pct: 100 },
      ].map((cap) => (
        <div key={cap.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{cap.label}</span>
            <span className="font-mono text-gainn-green">{cap.pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all duration-1000"
              style={{ width: `${cap.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Index;
