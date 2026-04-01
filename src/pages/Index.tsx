import { useState, useEffect, useRef } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { BreakingNewsBanner, StatsBar } from "@/components/BreakingNewsBanner";
import { HeroLanding } from "@/components/HeroLanding";
import { AgentPipeline } from "@/components/AgentPipeline";
import { PipelineLog } from "@/components/PipelineLog";
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
import { DepartmentOverview } from "@/components/AgentCard";
import { useNews } from "@/hooks/useNews";
import { CATEGORIES } from "@/data/mockData";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff, AlertCircle, MapPin, TrendingUp, Zap, Star, X, Activity, Shield, Globe, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoFilter, GeoSelection, geoToQuery } from "@/components/GeoFilter";

// ── First-visit value prop banner ─────────────────────────
const BANNER_KEY = "gainn_banner_dismissed";
const HERO_KEY = "gainn_hero_dismissed";

function ValuePropBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(BANNER_KEY)) setVisible(true);
  }, []);
  function dismiss() { localStorage.setItem(BANNER_KEY, "true"); setVisible(false); }
  if (!visible) return null;
  return (
    <div className="w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono bg-surface-1 border-b border-border">
      <span className="flex-1 text-center text-accent">
        <span className="text-foreground/60 mr-1">✦</span>
        Real-time AI news from 12,891 verified sources — verified, unbiased, instant.
      </span>
      <button onClick={dismiss} aria-label="Dismiss banner"
        className="flex-shrink-0 p-1 rounded hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

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
  { id: "most-read", label: "Most Read Today", icon: Star },
  { id: "editors", label: "Editor's Pick", icon: Star },
];

// ── System Overview Mini Cards ─────────────────────────────
function SystemOverview() {
  const [uptime, setUptime] = useState(99.7);
  useEffect(() => {
    const iv = setInterval(() => setUptime(99.5 + Math.random() * 0.49), 10000);
    return () => clearInterval(iv);
  }, []);

  const items = [
    { icon: Bot, label: "Active Agents", value: "108", sub: "across 10 departments", color: "text-gainn-green", borderColor: "border-gainn-green/20" },
    { icon: Shield, label: "Verification Rate", value: "97.2%", sub: "real-time fact checking", color: "text-gainn-amber", borderColor: "border-gainn-amber/20" },
    { icon: Globe, label: "Global Coverage", value: "34 nations", sub: "12,891 sources monitored", color: "text-accent", borderColor: "border-accent/20" },
    { icon: Activity, label: "System Uptime", value: `${uptime.toFixed(1)}%`, sub: "zero downtime target", color: "text-gainn-cyan", borderColor: "border-gainn-cyan/20" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`card-glass rounded-lg p-3 border ${item.borderColor} transition-all hover:scale-[1.01]`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</span>
            </div>
            <div className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</div>
            <div className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────
function SystemFooter({ isLive }: { isLive: boolean }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <footer className="border-t border-border mt-12">
      {/* System status bar */}
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

      {/* Main footer */}
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
  const pipelineRef = useRef<HTMLDivElement>(null);

  const catFromUrl = searchParams.get("cat") ?? "All";
  const [activeCategory, setActiveCategory] = useState(catFromUrl);
  const [geo, setGeo] = useState<GeoSelection>({ country: null, state: null, city: null });
  const [feedTab, setFeedTab] = useState("top");
  const [showHero, setShowHero] = useState(() => !localStorage.getItem(HERO_KEY));
  const [showAgentLog, setShowAgentLog] = useState(false);

  useEffect(() => { setActiveCategory(searchParams.get("cat") ?? "All"); }, [searchParams]);

  const newsCategory = activeCategory === "All" ? "all" : activeCategory;
  const location = geoToQuery(geo);
  const { articles, isLive, isLoading, isError, error, fetchedAt, refresh } = useNews({ category: newsCategory, pageSize: 20, location });

  const mostRead = [...articles].sort((a, b) => b.credibilityScore - a.credibilityScore);
  const editorsPick = articles.filter((a) => a.isBreaking || a.credibilityScore >= 95).slice(0, 8);
  const displayArticles = feedTab === "most-read" ? mostRead : feedTab === "editors" ? (editorsPick.length > 0 ? editorsPick : articles) : articles;
  const isPremium = (idx: number) => idx % 7 === 6;

  function scrollToFeed() { feedRef.current?.scrollIntoView({ behavior: "smooth" }); }
  function scrollToPipeline() { pipelineRef.current?.scrollIntoView({ behavior: "smooth" }); }
  function dismissHero() { localStorage.setItem(HERO_KEY, "true"); setShowHero(false); }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader onNewsroomClick={() => navigate("/newsroom")} onCategoryChange={setActiveCategory} activeCategory={activeCategory} />
      <ValuePropBanner />
      <NewsTickerBar />
      <MarketTicker />

      {/* ── HERO LANDING ── */}
      {showHero && (
        <div className="relative">
          <HeroLanding onViewFeed={scrollToFeed} onHowItWorks={scrollToPipeline} />
          <button
            onClick={dismissHero}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-2/80 hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-colors text-xs font-mono flex items-center gap-1 z-10"
          >
            <X className="w-3 h-3" /> Skip intro
          </button>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── AI AGENT PIPELINE ── */}
        <div ref={pipelineRef}>
          <AgentPipeline />
        </div>

        {/* ── SYSTEM OVERVIEW CARDS ── */}
        <SystemOverview />

        {/* Toggle agent log */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAgentLog(!showAgentLog)}
              className="text-xs font-mono text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              {showAgentLog ? "Hide" : "Show"} Live Agent Activity
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gainn-green">
            <span className="w-1.5 h-1.5 rounded-full bg-gainn-green live-dot" />
            System Live
          </div>
        </div>

        {/* Agent Activity Log Panel */}
        {showAgentLog && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            <div className="max-h-[360px]">
              <PipelineLog />
            </div>
            <DepartmentOverview />
          </div>
        )}

        <BreakingNewsBanner />
        <StatsBar />
        <AIMorningBriefing />

        {/* Geo Filter + status bar */}
        <div ref={feedRef} className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <GeoFilter value={geo} onChange={setGeo} />
            <LiveBadge isLive={isLive} fetchedAt={fetchedAt} />
            <Button variant="ghost" size="icon"
              className={`h-7 w-7 text-muted-foreground hover:text-foreground ${isLoading ? "animate-spin" : ""}`}
              onClick={refresh} disabled={isLoading}>
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
              <button key={tab.id} onClick={() => setFeedTab(tab.id)}
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

        {feedTab === "just-in" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <JustInFeed />
            <div className="space-y-4"><TrendingTopicsSidebar onTagClick={() => {}} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-6">
              {isLoading ? <HeroGridSkeleton /> : displayArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><HeroArticleCard article={displayArticles[0]} /></div>
                  <div className="space-y-4">
                    {displayArticles.slice(1, 3).map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
                  </div>
                </div>
              ) : null}

              {isLoading ? <SmallGridSkeleton /> : displayArticles.length >= 4 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayArticles.slice(3, 7).map((a, i) => <ArticleCard key={a.id} article={a} isPremium={isPremium(i + 3)} />)}
                </div>
              )}

              {!isLoading && displayArticles.length >= 4 && <SponsoredSlot />}
              <AIAnchorPanel />
              <TrendingVideosSection />
              <WorldNewsMap />

              {!isLoading && displayArticles.length > 7 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-3">
                    More Stories — {geo.city ?? geo.state ?? geo.country
                      ? `${geo.city ?? geo.state ?? geo.country} · ${activeCategory === "All" ? "All Topics" : activeCategory}`
                      : activeCategory === "All" ? "Top Headlines" : activeCategory}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayArticles.slice(7).map((a, i) => <ArticleCard key={a.id} article={a} isPremium={isPremium(i + 7)} />)}
                  </div>
                </div>
              )}

              {!isLoading && displayArticles.length > 0 && (
                <div className="text-center py-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    {displayArticles.length} articles
                    {location && <> • <span className="text-accent">{location}</span></>}
                    {" "}• {isLive ? "Live from NewsAPI" : "Demo data"} •{" "}
                    <button onClick={refresh} className="text-primary hover:text-accent transition-colors">Refresh</button>
                  </span>
                </div>
              )}
            </div>

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
              <TrendingTopicsSidebar />
            </div>
          </div>
        )}

        <NewsletterBanner />
      </main>

      <SystemFooter isLive={isLive} />
    </div>
  );
};

export default Index;
