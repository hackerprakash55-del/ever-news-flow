import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { ArticleCard, ArticleListItem } from "@/components/ArticleCards";
import { HeroGridSkeleton } from "@/components/ArticleSkeletons";
import { useNews } from "@/hooks/useNews";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, RefreshCw, Wifi, WifiOff } from "lucide-react";

export default function TrendingPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const newsCategory = category === "All" ? "all" : category;

  const { articles, isLoading, isLive, refresh, fetchedAt } = useNews({ category: newsCategory, pageSize: 50 });
  const [isLiveSocket, setIsLiveSocket] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // ── WebSocket pulse — refresh feed when broadcast ticks arrive ──
  useEffect(() => {
    const channel = supabase
      .channel("trending-clips-pulse")
      .on("broadcast", { event: "tick" }, () => {
        setPulseCount((c) => c + 1);
      })
      .subscribe((status) => setIsLiveSocket(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Periodically refetch on pulses (throttled — every 10 pulses ≈ 15s)
  useEffect(() => {
    if (pulseCount > 0 && pulseCount % 10 === 0) refresh();
  }, [pulseCount, refresh]);

  const hero = articles[0];
  const grid = articles.slice(1, 13);
  const list = articles.slice(13);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Trending Now — GAINN"
        description="The stories driving global conversation right now. Real-time trending headlines verified by GAINN's autonomous AI newsroom."
        path="/trending"
      />
      <GlobalHeader onNewsroomClick={() => navigate("/newsroom")} onCategoryChange={(c) => setParams({ category: c })} activeCategory={category} />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground mb-2 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-gainn-red" />
              <h1 className="text-2xl md:text-3xl font-display">
                Trending in <span className="text-gainn-red">{category}</span>
              </h1>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1.5">
              Live ranked stories · auto-updating via WebSocket
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
              isLiveSocket
                ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10"
                : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full live-dot ${isLiveSocket ? "bg-gainn-green" : "bg-gainn-amber"}`} />
              WS {isLiveSocket ? "CONNECTED" : "CONNECTING…"} · {pulseCount} pulses
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full border ${
              isLive ? "text-gainn-green border-gainn-green/30 bg-gainn-green/10"
                     : "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10"
            }`}>
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? "Live feed" : "Demo"}
              {fetchedAt && <span className="opacity-60 ml-1">{new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
            </span>
            <Button size="sm" variant="outline" onClick={refresh} className="gap-1.5 h-7 text-xs">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <HeroGridSkeleton />
        ) : articles.length === 0 ? (
          <div className="card-glass rounded-lg p-8 text-center text-sm text-muted-foreground">
            No trending articles right now in {category}.
          </div>
        ) : (
          <>
            {hero && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3"><ArticleCard article={hero} isPremium={false} /></div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grid.map((a) => <ArticleCard key={a.id} article={a} isPremium={false} />)}
            </div>

            {list.length > 0 && (
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border text-sm font-semibold">More in {category}</div>
                <div className="p-2 space-y-1">
                  {list.map((a, i) => <ArticleListItem key={a.id} article={a} index={i} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}