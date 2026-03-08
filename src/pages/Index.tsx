import { useState, useEffect } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { BreakingNewsBanner, StatsBar } from "@/components/BreakingNewsBanner";
import { HeroArticleCard, ArticleCard, ArticleListItem } from "@/components/ArticleCards";
import { WorldNewsMap } from "@/components/WorldNewsMap";
import { AIAnchorPanel } from "@/components/AIAnchorPanel";
import { TrendingVideosSection } from "@/components/TrendingVideosSection";
import { useNews } from "@/hooks/useNews";
import { CATEGORIES } from "@/data/mockData";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoFilter, GeoSelection, geoToQuery } from "@/components/GeoFilter";

const SkeletonCard = () => (
  <div className="card-glass rounded-lg overflow-hidden h-48 shimmer-bg" />
);

const LiveBadge = ({ isLive, fetchedAt }: { isLive: boolean; fetchedAt: string | null }) => (
  <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
    isLive
      ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10"
      : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
  }`}>
    {isLive ? (
      <><Wifi className="w-3 h-3" /> Live</>
    ) : (
      <><WifiOff className="w-3 h-3" /> Demo</>
    )}
    {fetchedAt && (
      <span className="opacity-60 ml-1">
        {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    )}
  </div>
);

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const catFromUrl = searchParams.get("cat") ?? "All";
  const [activeCategory, setActiveCategory] = useState(catFromUrl);
  const [geo, setGeo] = useState<GeoSelection>({ country: null, state: null, city: null });

  // Sync if URL param changes (e.g. back/forward)
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

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader
        onNewsroomClick={() => navigate("/newsroom")}
        onCategoryChange={setActiveCategory}
        activeCategory={activeCategory}
      />
      <NewsTickerBar />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Breaking Banner + Stats */}
        <BreakingNewsBanner />
        <StatsBar />

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

          {/* Active geo breadcrumb */}
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

        {/* Error banner (non-blocking) */}
        {isError && error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Live feed unavailable ({error}) — showing demo articles. <button onClick={refresh} className="underline">Retry</button></span>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Hero */}
            {isLoading ? (
              <div className="rounded-lg shimmer-bg" style={{ minHeight: 480 }} />
            ) : articles[0] ? (
              <HeroArticleCard article={articles[0]} />
            ) : null}

            {/* 3-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                : articles.slice(1, 4).map((a) => <ArticleCard key={a.id} article={a} />)
              }
            </div>

            {/* AI Anchor */}
            <AIAnchorPanel />

            {/* Trending Video Reports */}
            <TrendingVideosSection />

            {/* World Map */}
            <WorldNewsMap />

            {/* More articles */}
            {!isLoading && articles.length > 4 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-3">
                  More Stories —{" "}
                  {geo.city ?? geo.state ?? geo.country
                    ? `${geo.city ?? geo.state ?? geo.country} · ${activeCategory === "All" ? "All Topics" : activeCategory}`
                    : activeCategory === "All" ? "Top Headlines" : activeCategory}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {articles.slice(4).map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Load more indicator */}
            {!isLoading && articles.length > 0 && (
              <div className="text-center py-4">
                <span className="text-xs font-mono text-muted-foreground">
                  {articles.length} articles
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
            {/* Trending */}
            <div className="card-glass rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold">Trending Now</span>
                {isLive && <span className="text-[10px] font-mono text-gainn-green">● Live</span>}
              </div>
              <div className="p-2 space-y-1">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 rounded shimmer-bg mx-2 mb-1" />
                    ))
                  : articles.slice(0, 8).map((a, i) => (
                      <ArticleListItem key={a.id} article={a} index={i} />
                    ))
                }
              </div>
            </div>


            {/* AI Capabilities Card */}
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
                        className="h-full rounded-full bg-gradient-primary"
                        style={{ width: `${cap.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

export default Index;
