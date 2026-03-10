import { useNews } from "@/hooks/useNews";
import { Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Article } from "@/data/mockData";

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function storeAndNavigate(article: Article, navigate: (path: string) => void) {
  try { sessionStorage.setItem(`article-${article.id}`, JSON.stringify(article)); } catch {}
  navigate(`/article/${article.id}`);
}

export const JustInFeed = () => {
  const { articles, isLive, isLoading } = useNews({ pageSize: 8 });
  const navigate = useNavigate();
  const recent = articles.slice(0, 8);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gainn-red live-dot" />
          <Zap className="w-3.5 h-3.5 text-gainn-red" />
          <span className="text-sm font-bold uppercase tracking-wider text-gainn-red">Just In</span>
        </div>
        {isLive && <span className="ml-auto text-[10px] font-mono text-gainn-green">Live Feed</span>}
      </div>

      <div className="divide-y divide-border/50">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 flex gap-2">
                <div className="w-12 h-12 rounded shimmer-bg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded shimmer-bg" />
                  <div className="h-3 w-3/4 rounded shimmer-bg" />
                </div>
              </div>
            ))
          : recent.map((article) => (
              <button
                key={article.id}
                onClick={() => storeAndNavigate(article, navigate)}
                className="w-full text-left p-3 flex gap-3 hover:bg-surface-2 transition-colors group"
              >
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-surface-3 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📰</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {article.isBreaking && (
                    <span className="text-[9px] font-bold text-gainn-red uppercase mr-1">⚡ Breaking ·</span>
                  )}
                  <p className="text-xs font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug inline">
                    {article.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(article.publishedAt)}
                    <span className="text-border">·</span>
                    <span>{article.category}</span>
                  </div>
                </div>
              </button>
            ))
        }
      </div>
    </div>
  );
};
