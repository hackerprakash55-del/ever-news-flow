import { Article } from "@/data/mockData";
import { Shield, Clock, ExternalLink, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const CredibilityBadge = ({ score }: { score: number }) => {
  const cls = score >= 90 ? "credibility-high" : score >= 70 ? "credibility-medium" : "credibility-low";
  return (
    <span className={`flex items-center gap-1 text-xs font-mono ${cls}`}>
      <Shield className="w-3 h-3" />
      {score}%
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorMap: Record<string, string> = {
    AI: "text-gainn-cyan border-gainn-cyan/30 bg-gainn-cyan/10",
    Technology: "text-gainn-blue border-gainn-blue/30 bg-gainn-blue/10",
    Science: "text-gainn-purple border-gainn-purple/30 bg-gainn-purple/10",
    Economy: "text-gainn-amber border-gainn-amber/30 bg-gainn-amber/10",
    Environment: "text-gainn-green border-gainn-green/30 bg-gainn-green/10",
    Politics: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    Health: "text-pink-400 border-pink-400/30 bg-pink-400/10",
    Space: "text-gainn-purple border-gainn-purple/30 bg-gainn-purple/10",
    Global: "text-gainn-cyan border-gainn-cyan/30 bg-gainn-cyan/10",
  };
  const c = colorMap[category] || "text-muted-foreground border-border bg-surface-2";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-semibold uppercase tracking-wider ${c}`}>
      {category}
    </span>
  );
};

// ── Hero Card ──────────────────────────────────────────────
export const HeroArticleCard = ({ article }: { article: Article }) => (
  <Link to={`/article/${article.id}`} className="block group">
    <div className="relative overflow-hidden rounded-lg bg-surface-1 border border-border card-hover cursor-pointer" style={{ minHeight: 480 }}>
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.headline}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-6 min-h-[480px]">
        <div className="flex items-center gap-2 mb-3">
          {article.isBreaking && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-gainn-red">
              <Zap className="w-3 h-3" />
              BREAKING
            </span>
          )}
          <CategoryBadge category={article.category} />
        </div>
        <h2 className="text-2xl md:text-3xl font-display text-foreground mb-3 group-hover:text-gainn-cyan transition-colors leading-tight">
          {article.headline}
        </h2>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.summary}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <CredibilityBadge score={article.credibilityScore} />
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min read</span>
          <span className="font-mono">{new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="text-gainn-blue/60">AI Generated</span>
        </div>
      </div>
    </div>
  </Link>
);

// ── Standard Card ──────────────────────────────────────────
export const ArticleCard = ({ article }: { article: Article }) => (
  <Link to={`/article/${article.id}`} className="block group">
    <div className="card-glass rounded-lg overflow-hidden card-hover cursor-pointer h-full flex flex-col">
      {article.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <CategoryBadge category={article.category} />
          {article.isBreaking && (
            <span className="text-[10px] font-bold text-gainn-red uppercase tracking-wider">Breaking</span>
          )}
        </div>
        <h3 className="text-sm font-display text-foreground mb-2 line-clamp-3 group-hover:text-gainn-cyan transition-colors leading-snug flex-1">
          {article.headline}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <CredibilityBadge score={article.credibilityScore} />
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />{article.readTime}m
          </span>
        </div>
      </div>
    </div>
  </Link>
);

// ── Compact List Card ──────────────────────────────────────
export const ArticleListItem = ({ article, index }: { article: Article; index: number }) => (
  <Link to={`/article/${article.id}`} className="block group">
    <div className="flex gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer">
      <span className="text-xl font-mono font-bold text-muted-foreground/40 w-7 flex-shrink-0 pt-0.5">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={article.category} />
          {article.isBreaking && (
            <span className="text-[9px] font-bold text-gainn-red uppercase">⚡ Breaking</span>
          )}
        </div>
        <h4 className="text-sm font-medium text-foreground group-hover:text-gainn-cyan transition-colors line-clamp-2 leading-snug">
          {article.headline}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <CredibilityBadge score={article.credibilityScore} />
          <span className="font-mono">{new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
      {article.imageUrl && (
        <img src={article.imageUrl} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0 opacity-70" />
      )}
    </div>
  </Link>
);
