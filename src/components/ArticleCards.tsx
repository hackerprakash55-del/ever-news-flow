import { Article } from "@/data/mockData";
import { Shield, Clock, ExternalLink, Zap, Bookmark, BookmarkCheck, Share2, MessageSquare, Crown, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackArticleView } from "@/components/SoftSignInPrompt";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Store live article in sessionStorage so the article page can retrieve it
function storeAndNavigate(article: Article, navigate: (path: string) => void) {
  try { sessionStorage.setItem(`article-${article.id}`, JSON.stringify(article)); } catch {}
  navigate(`/article/${article.id}`);
}

// ── Sub-components ────────────────────────────────────────
const CredibilityBadge = ({ score }: { score: number }) => {
  const cls = score >= 90 ? "credibility-high" : score >= 70 ? "credibility-medium" : "credibility-low";
  return (
    <span className={`flex items-center gap-1 text-xs font-mono ${cls}`}>
      <Shield className="w-3 h-3" />{score}%
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorMap: Record<string, string> = {
    AI: "text-gainn-cyan border-gainn-cyan/30 bg-gainn-cyan/10",
    Technology: "text-primary border-primary/30 bg-primary/10",
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

// Tooltip explaining AI Verified badge
const AIVerifiedBadge = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gainn-cyan cursor-help">
          <CheckCircle2 className="w-3 h-3" />AI Verified
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-xs">
        This article was cross-checked by GAINN's AI fact-verification agents against 100+ primary sources. Bias and credibility scores are computed independently.
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Bookmark + Share actions
function useArticleActions(article: Article) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    setSaving(true);
    if (isSaved) {
      await supabase.from("saved_articles").delete().eq("user_id", user.id).eq("article_id", article.id);
      setIsSaved(false);
      toast({ title: "Removed from saved" });
    } else {
      await supabase.from("saved_articles").insert({
        user_id: user.id, article_id: article.id, headline: article.headline,
        summary: article.summary, category: article.category, image_url: article.imageUrl,
        region: article.region, read_time: article.readTime, published_at: article.publishedAt,
      });
      setIsSaved(true);
      toast({ title: "Saved!", description: "Find it in Settings → Saved Articles" });
    }
    setSaving(false);
  }

  function share(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/article/${article.id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  }

  return { isSaved, saving, toggleSave, share };
}

// Mock author data derived deterministically from article id
function getAuthor(article: Article) {
  const authors = [
    { name: "Sarah Chen", avatar: "SC", role: "Senior AI Correspondent" },
    { name: "Marcus Webb", avatar: "MW", role: "Global Affairs Editor" },
    { name: "Priya Nair", avatar: "PN", role: "Science Reporter" },
    { name: "James Okafor", avatar: "JO", role: "Economics Analyst" },
    { name: "Elena Vasquez", avatar: "EV", role: "Climate Correspondent" },
    { name: "Kai Tanaka", avatar: "KT", role: "Technology Editor" },
  ];
  const idx = article.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % authors.length;
  return authors[idx];
}

// Mock comment count
function getCommentCount(article: Article) {
  return (article.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 89) + 12;
}

// Source credibility helper
function getSourceReliability(score: number) {
  if (score >= 95) return { label: "Very High", color: "text-gainn-green" };
  if (score >= 85) return { label: "High", color: "text-gainn-amber" };
  return { label: "Medium", color: "text-muted-foreground" };
}

// ── Hero Card ──────────────────────────────────────────────
export const HeroArticleCard = ({ article }: { article: Article }) => {
  const navigate = useNavigate();
  const { isSaved, saving, toggleSave, share } = useArticleActions(article);
  const author = getAuthor(article);
  const comments = getCommentCount(article);

  return (
    <div className="block group cursor-pointer" onClick={() => storeAndNavigate(article, navigate)}>
      <div className="relative overflow-hidden rounded-lg bg-surface-1 border border-border card-hover" style={{ minHeight: 480 }}>
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-55 transition-opacity duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 min-h-[480px]">
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-gainn-red animate-pulse">
                <Zap className="w-3 h-3" />BREAKING
              </span>
            )}
            {article.aiGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-gainn-purple border border-gainn-purple/30 bg-gainn-purple/10">
                <Crown className="w-2.5 h-2.5" />AI Authored
              </span>
            )}
            <CategoryBadge category={article.category} />
          </div>

          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-3 group-hover:text-accent transition-colors leading-tight">
            {article.headline}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.summary}</p>

          {/* Author + meta row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {author.avatar}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">{author.name}</span>
                <span className="text-[10px] text-muted-foreground block">{author.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <CredibilityBadge score={article.credibilityScore} />
              <AIVerifiedBadge />
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min read</span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <MessageSquare className="w-3 h-3" />{comments}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                isSaved
                  ? "border-accent/40 text-accent bg-accent/10"
                  : "border-border text-muted-foreground hover:border-accent/40 hover:text-accent"
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
              {isSaved ? "Saved" : "Save"}
            </button>
            <button
              onClick={share}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Share2 className="w-3 h-3" />Share
            </button>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
              {new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
              <span className="text-gainn-green">{article.isBreaking ? "Updated live" : "Last updated"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Standard Card ──────────────────────────────────────────
export const ArticleCard = ({ article, isPremium }: { article: Article; isPremium?: boolean }) => {
  const navigate = useNavigate();
  const { isSaved, saving, toggleSave, share } = useArticleActions(article);
  const author = getAuthor(article);
  const comments = getCommentCount(article);
  const reliability = getSourceReliability(article.credibilityScore);

  return (
    <div
      className="block group cursor-pointer"
      onClick={() => storeAndNavigate(article, navigate)}
    >
      <div
        className="card-glass rounded-lg overflow-hidden h-full flex flex-col relative transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        {/* Premium overlay */}
        {isPremium && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-gainn-amber bg-gainn-amber/15 border border-gainn-amber/30">
            <Crown className="w-2.5 h-2.5" />PREMIUM
          </div>
        )}

        {/* Thumbnail */}
        <div className="h-40 overflow-hidden relative flex-shrink-0 bg-surface-2">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-card flex items-center justify-center">
              <span className="text-4xl opacity-20">📰</span>
            </div>
          )}
          {article.isBreaking && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-gainn-red text-white text-[9px] font-bold">
              <Zap className="w-2.5 h-2.5" />LIVE
            </div>
          )}
          {isPremium && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-end justify-center pb-3">
              <span className="text-xs text-gainn-amber font-semibold">🔒 Premium Article</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <CategoryBadge category={article.category} />
            {article.isBreaking && (
              <span className="text-[10px] font-bold text-gainn-red uppercase tracking-wider">Breaking</span>
            )}
          </div>

          <h3 className="text-sm font-display text-foreground mb-2 line-clamp-3 group-hover:text-accent transition-colors leading-snug flex-1">
            {article.headline}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.summary}</p>

          {/* Author */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
              {author.avatar}
            </div>
            <span className="text-[10px] text-muted-foreground truncate">{author.name}</span>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <span className={`text-[10px] font-mono ${reliability.color}`}>{article.sources[0]} — {reliability.label}</span>
          </div>

          {/* Read More link */}
          <div className="mb-2">
            <span
              className="text-xs font-semibold text-accent relative inline-block
                after:content-[''] after:absolute after:bottom-0 after:left-0
                after:w-full after:h-px after:bg-accent
                after:scale-x-0 after:origin-left
                after:transition-transform after:duration-200
                group-hover:after:scale-x-100"
            >
              Read More →
            </span>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <CredibilityBadge score={article.credibilityScore} />
              <span className="flex items-center gap-1 font-mono text-[10px]"><Clock className="w-3 h-3" />{article.readTime}m</span>
              <span className="flex items-center gap-1 font-mono text-[10px]"><MessageSquare className="w-3 h-3" />{comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSave}
                disabled={saving}
                className={`p-1 rounded transition-colors ${isSaved ? "text-accent" : "text-muted-foreground/50 hover:text-accent"}`}
              >
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={share}
                className="p-1 rounded text-muted-foreground/50 hover:text-primary transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Compact List Card ──────────────────────────────────────
export const ArticleListItem = ({ article, index }: { article: Article; index: number }) => {
  const navigate = useNavigate();
  const { isSaved, saving, toggleSave } = useArticleActions(article);

  return (
    <div className="block group cursor-pointer" onClick={() => storeAndNavigate(article, navigate)}>
      <div className="flex gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors">
        <span className="text-xl font-mono font-bold text-muted-foreground/40 w-7 flex-shrink-0 pt-0.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryBadge category={article.category} />
            {article.isBreaking && <span className="text-[9px] font-bold text-gainn-red uppercase">⚡ Breaking</span>}
          </div>
          <h4 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
            {article.headline}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <CredibilityBadge score={article.credibilityScore} />
            <span className="flex items-center gap-1 font-mono text-[10px]"><Clock className="w-3 h-3" />{article.readTime}m</span>
            <span className="font-mono text-[10px]">
              {new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {article.imageUrl && (
            <img src={article.imageUrl} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0 opacity-70" />
          )}
          <button
            onClick={toggleSave}
            disabled={saving}
            className={`p-0.5 rounded transition-colors ${isSaved ? "text-accent" : "text-muted-foreground/30 hover:text-accent"}`}
          >
            {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sponsored Slot ─────────────────────────────────────────
export const SponsoredSlot = ({ label = "Brought to you by TechCorp AI" }: { label?: string }) => (
  <div className="card-glass rounded-lg p-4 border-dashed border-border/50 flex items-center gap-3 opacity-70 hover:opacity-90 transition-opacity cursor-pointer">
    <div className="w-8 h-8 rounded bg-surface-3 flex items-center justify-center text-xs font-mono text-muted-foreground/50 flex-shrink-0">
      AD
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mt-0.5">Sponsored Content</p>
    </div>
  </div>
);
