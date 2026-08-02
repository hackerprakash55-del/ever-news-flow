import { Article } from "@/data/mockData";
import { Shield, Zap, Bookmark, BookmarkCheck, Share2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackArticleView } from "@/components/SoftSignInPrompt";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getProgress, isArticleRead } from "@/hooks/useReadingProgress";
import { useReveal } from "@/hooks/useReveal";

// Store live article in sessionStorage so the article page can retrieve it
function storeAndNavigate(article: Article, navigate: (path: string) => void) {
  try { sessionStorage.setItem(`article-${article.id}`, JSON.stringify(article)); } catch {}
  trackArticleView();
  navigate(`/article/${article.id}`);
}

// Read-progress bar shown at bottom of card
function ReadProgressBar({ articleId }: { articleId: string }) {
  const pct = getProgress(articleId);
  if (pct <= 0) return null;
  const color = pct >= 90
    ? "hsl(var(--gainn-green, 142 71% 45%))"
    : "hsl(var(--primary))";
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/50">
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────
// Single trust indicator: shield + score. Cyan is the only accent used for trust.
const TrustBadge = ({ score }: { score: number }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-accent/90 cursor-help">
          <Shield className="w-3 h-3" />{score}%
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-xs">
        AI-verified trust score, cross-checked against primary sources.
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// One neutral status tag — BREAKING in red only when actually breaking.
const StatusTag = ({ category, isBreaking }: { category: string; isBreaking?: boolean }) =>
  isBreaking ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-destructive border border-destructive/40 bg-destructive/10">
      <Zap className="w-2.5 h-2.5" />Breaking
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-surface-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {category}
    </span>
  );

// Quiet metadata line: source · author · read time
const MetaLine = ({ parts }: { parts: (string | number | undefined)[] }) => (
  <p className="text-[11px] text-muted-foreground/70 truncate">
    {parts.filter(Boolean).join(" · ")}
  </p>
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

  return (
    <div className="block group cursor-pointer animate-hero-rise" onClick={() => storeAndNavigate(article, navigate)}>
      <div className="card-glass relative overflow-hidden" style={{ minHeight: 480 }}>
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
          <div className="flex items-center justify-between gap-2 mb-3">
            <StatusTag category={article.category} isBreaking={article.isBreaking} />
            <TrustBadge score={article.credibilityScore} />
          </div>

          <h2 className="hero-headline text-foreground mb-3 group-hover:text-primary transition-colors">
            {article.headline}
          </h2>
          <MetaLine parts={[article.sources?.[0], author.name, `${article.readTime} min read`]} />
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{article.summary}</p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
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
              {new Date(article.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
  const alreadyRead = isArticleRead(article.id);
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div
      ref={revealRef}
      className="block group cursor-pointer reveal"
      onClick={() => storeAndNavigate(article, navigate)}
    >
      <div
        className="card-glass overflow-hidden h-full flex flex-col relative"
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
          {isPremium && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-end justify-center pb-3">
              <span className="text-xs text-gainn-amber font-semibold">🔒 Premium Article</span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-3">
            <StatusTag category={article.category} isBreaking={article.isBreaking} />
            <TrustBadge score={article.credibilityScore} />
          </div>

          <h3 className={`text-[15px] font-display mb-2 line-clamp-3 group-hover:text-accent transition-colors leading-snug ${alreadyRead ? "text-muted-foreground" : "text-foreground"}`}>
            {article.headline}
          </h3>
          <MetaLine parts={[article.sources?.[0], author.name, `${article.readTime} min read`]} />
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 mb-4">{article.summary}</p>

          {/* Footer row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
            <span className="text-xs font-medium text-accent inline-flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-0.5">
              {alreadyRead ? "Read again" : "Read"} →
            </span>
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

        {/* Reading progress bar at bottom of card */}
        <ReadProgressBar articleId={article.id} />
      </div>
    </div>
  );
};

// ── Compact List Card ──────────────────────────────────────
export const ArticleListItem = ({ article, index }: { article: Article; index: number }) => {
  const navigate = useNavigate();

  return (
    <div className="block group cursor-pointer" onClick={() => storeAndNavigate(article, navigate)}>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors">
        <span className="text-xs font-mono text-muted-foreground/40 w-6 flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h4 className="flex-1 min-w-0 text-[13px] text-foreground/90 group-hover:text-accent transition-colors truncate">
          {article.headline}
        </h4>
        <span className="text-[10px] font-mono text-muted-foreground/50 flex-shrink-0">
          {article.credibilityScore}%
        </span>
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
