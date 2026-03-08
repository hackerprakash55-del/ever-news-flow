import { useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { BreakingNewsBanner, StatsBar } from "@/components/BreakingNewsBanner";
import { HeroArticleCard, ArticleCard, ArticleListItem } from "@/components/ArticleCards";
import { WorldNewsMap } from "@/components/WorldNewsMap";
import { DepartmentOverview } from "@/components/AgentCard";
import { PipelineLog } from "@/components/PipelineLog";
import { AIAnchorPanel } from "@/components/AIAnchorPanel";
import { MOCK_ARTICLES, CATEGORIES } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showNewsroom, setShowNewsroom] = useState(false);
  const navigate = useNavigate();

  const filtered = activeCategory === "All"
    ? MOCK_ARTICLES
    : MOCK_ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader onNewsroomClick={() => navigate("/newsroom")} />
      <NewsTickerBar />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Breaking Banner + Stats */}
        <BreakingNewsBanner />
        <StatsBar />

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium font-mono transition-all ${
                activeCategory === cat
                  ? "bg-gainn-blue text-background"
                  : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Hero */}
            {filtered[0] && <HeroArticleCard article={filtered[0]} />}

            {/* 3-col grid */}
            {filtered.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.slice(1, 4).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}

            {/* AI Anchor */}
            <AIAnchorPanel />

            {/* World Map */}
            <WorldNewsMap />

            {/* More articles */}
            {filtered.length > 4 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-3">
                  More Stories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.slice(4).map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Trending */}
            <div className="card-glass rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">Trending Now</span>
              </div>
              <div className="p-2 space-y-1">
                {MOCK_ARTICLES.map((a, i) => (
                  <ArticleListItem key={a.id} article={a} index={i} />
                ))}
              </div>
            </div>

            {/* Department Overview */}
            <DepartmentOverview />

            {/* Pipeline Log */}
            <div style={{ height: 400 }}>
              <PipelineLog />
            </div>

            {/* AI Capabilities Card */}
            <div className="card-glass rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 text-gainn-cyan">AI Capabilities</h4>
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
                    <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
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
            <span>All articles AI-generated and fact-verified</span>
            <span className="text-border">|</span>
            <span className="text-gainn-green">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
