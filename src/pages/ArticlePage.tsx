import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { MOCK_ARTICLES, Article } from "@/data/mockData";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import {
  Shield, Clock, Globe, Tag, CheckCircle, ArrowLeft, Share2, Bookmark,
  BookmarkCheck, ChevronRight, ExternalLink, MapPin, Layers, TrendingUp, ChevronRight as Next,
} from "lucide-react";
import { Twitter, Linkedin, Link2, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useNews";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveProgress, getProgress } from "@/hooks/useReadingProgress";
import { markArticleFinished, EmailCaptureToast } from "@/components/EmailCaptureToast";
import { useLanguage, translateTexts, LANGUAGES } from "@/lib/language";

// ── Credibility meter ──────────────────────────────────────
const CredibilityMeter = ({ score }: { score: number }) => {
  const segments = 10;
  const filled = Math.round((score / 100) * segments);
  const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-sm transition-all"
            style={{ background: i < filled ? color : "hsl(var(--surface-3))" }} />
        ))}
      </div>
      <span className="text-sm font-bold font-mono" style={{ color }}>{score}%</span>
    </div>
  );
};

// ── Article lookup ─────────────────────────────────────────
function useArticle(id: string): Article | null {
  const { data } = useQuery({
    queryKey: ["article-lookup", id],
    queryFn: () => {
      const fromMock = MOCK_ARTICLES.find((a) => a.id === id);
      if (fromMock) return fromMock;
      try {
        const fromSession = sessionStorage.getItem(`article-${id}`);
        if (fromSession) return JSON.parse(fromSession) as Article;
      } catch {}
      return null;
    },
    staleTime: Infinity,
  });
  return data ?? null;
}

// ── Scroll progress bar ────────────────────────────────────
function ScrollProgressBar({ articleId }: { articleId: string }) {
  const [pct, setPct] = useState(() => getProgress(articleId));

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      const p = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      setPct(p);
      saveProgress(articleId, p);
      if (p >= 90) markArticleFinished();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-white/[0.04] pointer-events-none">
        <div
          className="h-full transition-[width] duration-100 ease-out"
          style={{
            width: `${pct}%`,
            background: "#00D4FF",
            boxShadow: "0 0 12px rgba(0,212,255,0.6)",
          }}
        />
      </div>
      {pct > 2 && (
        <div
          className="fixed z-[101] pointer-events-none top-[8px] transition-all duration-100"
          style={{ left: `calc(min(${pct}%, 100% - 56px) - 0px)` }}
        >
          <span
            className="inline-flex items-center justify-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(0,212,255,0.15)",
              color: "#00D4FF",
              border: "1px solid rgba(0,212,255,0.4)",
              backdropFilter: "blur(8px)",
            }}
          >
            {Math.round(pct)}%
          </span>
        </div>
      )}
    </>
  );
}

// ── Sticky share rail (desktop) ────────────────────────────
function ShareRail({ article }: { article: Article }) {
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 300); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(article.headline);
  const enc = encodeURIComponent(url);

  const xText = encodeURIComponent(`${article.headline}\n\n✓ AI Verified — GAINN`);
  const links = [
    { Icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?text=${xText}&url=${enc}&hashtags=GAINN,AINews` },
    { Icon: Linkedin, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
  ];

  return (
    <div
      className={`hidden lg:flex fixed left-4 xl:left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-2 p-2 rounded-full transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none"
      }`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {links.map(({ Icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all hover:scale-110"
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
      <button
        onClick={() => {
          navigator.clipboard?.writeText(url);
          toast({ title: "Link copied", description: "Article URL copied to clipboard" });
        }}
        aria-label="Copy link"
        className="w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all hover:scale-110"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Author card ────────────────────────────────────────────
function AuthorCard({ article }: { article: Article }) {
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const name = (article as any).author || "GAINN Editorial AI";
  const title = `${article.category} Desk · AI Correspondent`;
  const initials = name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
  const articleCount = 120 + (article.id.charCodeAt(0) % 80);

  return (
    <div
      className="mt-6 rounded-xl p-4 flex items-center gap-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full grid place-items-center text-sm font-bold font-mono flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#00D4FF,#0066ff)", color: "#001018" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground font-mono truncate">
          {title} · {articleCount} articles
        </div>
      </div>
      <button
        onClick={() => {
          setFollowing((f) => !f);
          toast({ title: following ? "Unfollowed" : `Following ${name}` });
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          following
            ? "bg-transparent border border-[#00D4FF]/40 text-[#00D4FF]"
            : "bg-[#00D4FF] text-[#001018] hover:scale-[1.03]"
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" />
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

// ── AI Analysis section ────────────────────────────────────
function AIAnalysis({ article }: { article: Article }) {
  const cat = article.category;
  const why = [
    `${article.summary} The story directly shapes how ${cat.toLowerCase()} stakeholders allocate attention and capital this week.`,
    `Beyond the headline, this signals a structural shift that ripples across adjacent markets, policy debates, and public sentiment.`,
  ].join(" ");
  const left = `Progressive analysts frame this as evidence that stronger oversight and equity-focused policy in ${cat.toLowerCase()} are overdue.`;
  const right = `Conservative commentators argue the development validates market-led approaches and warns against premature regulatory response.`;
  const intl = `International observers see ${article.region || "global"} dynamics at play, with implications for cross-border coordination and trade.`;
  const next1 = `Expect follow-on coverage within 48 hours as institutional actors respond and additional verified sources weigh in.`;
  const next2 = `Watch for a measurable shift in related indicators — sentiment, pricing, or policy proposals — over the next 1–2 weeks.`;

  return (
    <div
      className="mt-10 rounded-xl p-6"
      style={{
        background: "rgba(0,212,255,0.04)",
        borderLeft: "4px solid #00D4FF",
        border: "1px solid rgba(0,212,255,0.15)",
        borderLeftWidth: 4,
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#00D4FF]" />
        <h2 className="text-base font-display font-bold text-foreground">
          <span className="mr-1">🤖</span> GAINN AI Analysis
        </h2>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
          BETA
        </span>
      </div>

      <div className="space-y-5 text-sm">
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#00D4FF] mb-1.5">
            Why This Matters
          </h3>
          <p className="text-foreground/90 leading-relaxed">{why}</p>
        </section>

        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#00D4FF] mb-2">
            Perspectives
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Left view", color: "#5b8def", text: left },
              { label: "Right view", color: "#ff7a59", text: right },
              { label: "International", color: "#10b981", text: intl },
            ].map((p) => (
              <div key={p.label} className="rounded-lg p-3 bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1" style={{ color: p.color }}>
                  {p.label}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#00D4FF] mb-2">
            What Happens Next
          </h3>
          <ul className="space-y-2">
            {[next1, next2].map((t, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-mono font-bold mt-0.5"
                  style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

// ── Auto-load infinite scroll ─────────────────────────────
function InfiniteAutoLoad({ nextArticle }: { nextArticle: Article }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (fired.current) return;
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      if (pct >= 90) {
        fired.current = true;
        try { sessionStorage.setItem(`article-${nextArticle.id}`, JSON.stringify(nextArticle)); } catch {}
        setTimeout(() => {
          navigate(`/article/${nextArticle.id}`, { state: { article: nextArticle } });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 350);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nextArticle, navigate]);

  return <div ref={ref} className="h-1" />;
}

// ── Category gradient for thumbnail ───────────────────────
function getCategoryGradient(category: string): string {
  const map: Record<string, string> = {
    Economy: "linear-gradient(135deg,#0ea5e9,#14b8a6)",
    Technology: "linear-gradient(135deg,#06b6d4,#8b5cf6)",
    AI: "linear-gradient(135deg,#8b5cf6,#6366f1)",
    Science: "linear-gradient(135deg,#10b981,#14b8a6)",
    Environment: "linear-gradient(135deg,#22c55e,#15803d)",
    Health: "linear-gradient(135deg,#ec4899,#f43f5e)",
    Space: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    Politics: "linear-gradient(135deg,#f97316,#ef4444)",
    "Global Affairs": "linear-gradient(135deg,#ef4444,#f97316)",
    "Geopolitics": "linear-gradient(135deg,#ef4444,#f97316)",
  };
  return map[category] || "linear-gradient(135deg,#334155,#475569)";
}

// ── More Stories — 3-card grid ─────────────────────────────
function MoreStories({ articles, current }: { articles: Article[]; current: Article }) {
  const navigate = useNavigate();
  // Mix same-category + other articles for variety
  const sameCategory = articles.filter((a) => a.id !== current.id && a.category === current.category);
  const otherArticles = articles.filter((a) => a.id !== current.id && a.category !== current.category);
  const related = [...sameCategory, ...otherArticles].slice(0, 3);

  if (related.length === 0) return null;

  function go(a: Article) {
    try { sessionStorage.setItem(`article-${a.id}`, JSON.stringify(a)); } catch {}
    navigate(`/article/${a.id}`, { state: { article: a } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-4 h-4 text-accent" />
        <h2 className="text-base font-display font-semibold">Continue Reading</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((a) => (
          <div
            key={a.id}
            onClick={() => go(a)}
            className="cursor-pointer group rounded-lg overflow-hidden border border-border transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-accent/30"
          >
            <div className="h-36 overflow-hidden relative">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-80 group-hover:opacity-100" />
              ) : (
                <div className="w-full h-full" style={{ background: getCategoryGradient(a.category) }} />
              )}
              <div className="absolute top-2 left-2">
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                  {a.category}
                </span>
              </div>
            </div>
            <div className="p-3 bg-surface-1">
              <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug mb-2">
                {a.headline}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m read</span>
                <span className="text-[10px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Read More →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Continue Reading auto-load card ───────────────────────
function ContinueReading({ nextArticle }: { nextArticle: Article }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  function go() {
    try { sessionStorage.setItem(`article-${nextArticle.id}`, JSON.stringify(nextArticle)); } catch {}
    navigate(`/article/${nextArticle.id}`, { state: { article: nextArticle } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div ref={ref} className="mt-12">
      <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-mono text-muted-foreground px-3">CONTINUE READING</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div
          onClick={go}
          className="rounded-xl border border-border overflow-hidden cursor-pointer group hover:border-accent/40 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="flex gap-0 h-32 md:h-40">
            <div className="flex-1 p-5 flex flex-col justify-between bg-surface-1 group-hover:bg-surface-2 transition-colors">
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider mb-2 block">
                  {nextArticle.category}
                </span>
                <h3 className="text-sm md:text-base font-display text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-3">
                  {nextArticle.headline}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />{nextArticle.readTime} min read
                <span className="ml-auto flex items-center gap-1 text-accent font-semibold">
                  Read Next <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
            {nextArticle.imageUrl && (
              <div className="w-32 md:w-48 flex-shrink-0 overflow-hidden">
                <img src={nextArticle.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70 group-hover:opacity-90" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sticky mobile bottom bar ───────────────────────────────
function StickyMobileBar({ nextArticle }: { nextArticle: Article }) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y < 200); // hide near top
      lastScroll.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go() {
    try { sessionStorage.setItem(`article-${nextArticle.id}`, JSON.stringify(nextArticle)); } catch {}
    navigate(`/article/${nextArticle.id}`, { state: { article: nextArticle } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border transition-transform duration-300 ${hidden ? "translate-y-full" : "translate-y-0"}`}
      style={{ background: "hsl(222 28% 9%)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Read Next</p>
          <p className="text-xs font-medium text-foreground line-clamp-1">{nextArticle.headline}</p>
        </div>
        <button
          onClick={go}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          Read Next <Next className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);

  // Resolve article from state → mock → sessionStorage
  let article: Article | null = (location.state as any)?.article ?? null;
  if (!article) article = MOCK_ARTICLES.find((a) => a.id === id) ?? null;
  if (!article && id) {
    try {
      const stored = sessionStorage.getItem(`article-${id}`);
      if (stored) article = JSON.parse(stored);
    } catch {}
  }

  const { articles: liveArticles } = useNews({ category: "all", pageSize: 20 });

  useEffect(() => {
    if (!user || !article) return;
    supabase.from("saved_articles").select("id").eq("user_id", user.id).eq("article_id", article.id).single()
      .then(({ data }) => setIsSaved(!!data));
  }, [user, article?.id]);

  async function toggleSave() {
    if (!user) { navigate("/auth", { state: { from: location.pathname } }); return; }
    if (!article) return;
    setSavingArticle(true);
    if (isSaved) {
      await supabase.from("saved_articles").delete().eq("user_id", user.id).eq("article_id", article.id);
      setIsSaved(false);
      toast({ title: "Removed from saved" });
    } else {
      await supabase.from("saved_articles").insert({
        user_id: user.id, article_id: article.id, headline: article.headline,
        summary: article.summary, category: article.category, image_url: article.imageUrl,
        source_url: (article as any).url, region: article.region, read_time: article.readTime,
        published_at: article.publishedAt,
      });
      setIsSaved(true);
      toast({ title: "Saved!", description: "Find it in Settings → Saved Articles" });
    }
    setSavingArticle(false);
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <NewsTickerBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-display mb-2">Article not found</h1>
            <p className="text-muted-foreground text-sm">This article may have expired from the live feed.</p>
            <Button variant="outline" onClick={() => navigate("/")}>← Back to GAINN</Button>
          </div>
        </div>
      </div>
    );
  }

  const allArticles = [
    ...MOCK_ARTICLES,
    ...liveArticles.filter((a) => !MOCK_ARTICLES.find((m) => m.id === a.id)),
  ];

  const sameCategory = allArticles.filter((a) => a.id !== article!.id && a.category === article!.category).slice(0, 3);
  const sameRegion = allArticles.filter((a) => a.id !== article!.id && a.region && article!.region && a.region !== "Global" && a.region === article!.region && a.category !== article!.category).slice(0, 2);
  const breaking = allArticles.filter((a) => a.id !== article!.id && a.isBreaking && a.category !== article!.category).slice(0, 2);

  // Next article for Continue Reading & sticky bar
  const currentIndex = allArticles.findIndex((a) => a.id === article!.id);
  const nextArticle = allArticles[(currentIndex + 1) % Math.max(allArticles.length, 1)] ?? allArticles[0];
  const showNext = nextArticle && nextArticle.id !== article.id;

  const biasLabel = Math.abs(article.biasScore) < 0.1 ? "Neutral" : article.biasScore > 0 ? "Slight Right" : "Slight Left";
  const isLiveArticle = article.id.startsWith("live-");
  const paragraphs = article.body ? article.body.split("\n\n").filter(Boolean) : [];

  // SEO fields
  const pageTitle = `${article.headline} | GAINN`;
  const metaDesc = (article.body || article.summary).replace(/\n/g, " ").slice(0, 160);
  const ogImage = article.imageUrl || "https://ever-news-flow.lovable.app/og-default.jpg";
  const canonicalUrl = `https://ever-news-flow.lovable.app/article/${article.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.headline,
    "description": article.summary,
    "image": ogImage,
    "datePublished": article.publishedAt,
    "dateModified": article.publishedAt,
    "author": { "@type": "Organization", "name": "GAINN" },
    "publisher": {
      "@type": "Organization",
      "name": "GAINN",
      "logo": { "@type": "ImageObject", "url": "https://ever-news-flow.lovable.app/favicon.ico" }
    },
    "url": canonicalUrl,
    "articleSection": article.category,
    "keywords": article.tags.join(", "),
  };

  return (
    <>
      {/* ── SEO ──────────────────────────────────────────── */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.headline} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="GAINN" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.headline} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        {/* Article meta */}
        <meta property="article:published_time" content={article.publishedAt} />
        <meta property="article:section" content={article.category} />
        {article.tags.map((t) => <meta key={t} property="article:tag" content={t} />)}
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Scroll progress */}
        <ScrollProgressBar articleId={article.id} />
        <GlobalHeader />
        <NewsTickerBar />
        <ShareRail article={article} />

        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span>{article.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-xs">{article.headline}</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
            {/* ── Article body ── */}
            <div>
              {article.imageUrl && (
                <div className="relative rounded-xl overflow-hidden mb-6" style={{ height: 380 }}>
                  <img src={article.imageUrl} alt={article.headline} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                  {article.isBreaking && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-gainn-red text-white text-xs font-bold rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />BREAKING NEWS
                    </div>
                  )}
                  {isLiveArticle && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-gainn-green/90 text-white text-[10px] font-bold rounded-md font-mono">
                      LIVE SOURCE
                    </div>
                  )}
                </div>
              )}

              {/* Category + tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded border text-xs font-mono font-bold text-accent border-accent/30 bg-accent/10">
                  {article.category}
                </span>
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-surface-2 text-muted-foreground">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>

              <TranslatedArticleBody
                headline={article.headline}
                summary={article.summary}
                paragraphs={paragraphs}
                between={
                  <>
                    <Link
                      to="/shorts"
                      className="group flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-red-500/10 hover:from-cyan-500/20 hover:to-red-500/20 transition-all"
                    >
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                        ▶
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[10px] font-black tracking-widest text-cyan-300">⚡ AI SHORTS</span>
                        <span className="text-sm text-foreground font-medium">Watch this story as a 30-second AI news short →</span>
                      </span>
                    </Link>

                    <AuthorCard article={article} />

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                      <span className={`flex items-center gap-1.5 font-mono text-xs ${isLiveArticle ? "text-gainn-green" : "text-accent"}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isLiveArticle ? "Live News" : "AI Generated & Verified"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />{new Date(article.publishedAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {article.readTime} min read
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> {article.region}
                      </span>
                    </div>
                  </>
                }
              />

              {isLiveArticle && (article as any).url && (
                <div className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 text-sm text-accent mb-1">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-semibold">Read Full Story</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Sourced from the original publisher.</p>
                  <a href={(article as any).url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-accent transition-colors border border-primary/30 rounded px-3 py-1.5">
                    <ExternalLink className="w-3 h-3" />{article.sources[0] || "Original Source"}
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
                <Button
                  variant="outline" size="sm"
                  className={`gap-2 transition-colors ${isSaved ? "text-accent border-accent/40 bg-accent/10" : ""}`}
                  onClick={toggleSave} disabled={savingArticle}
                >
                  {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <ArrowLeft className="w-3.5 h-3.5" /> All News
                  </Button>
                </Link>
              </div>

              {/* ── More Stories ── */}
              <AIAnalysis article={article} />
              <MoreStories articles={allArticles} current={article} />

              {/* ── Continue Reading ── */}
              {showNext && <ContinueReading nextArticle={nextArticle} />}
              {showNext && <InfiniteAutoLoad nextArticle={nextArticle} />}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-5">
              {/* AI Fact Check */}
              <div className="card-glass rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">AI Fact Check Report</h3>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Credibility Score</div>
                  <CredibilityMeter score={article.credibilityScore} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">Bias Analysis</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface-3 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border" />
                      <div className="absolute inset-y-0 w-3 h-2 rounded-full bg-accent transform -translate-x-1/2"
                        style={{ left: `${50 + article.biasScore * 50}%` }} />
                    </div>
                    <span className="text-xs font-mono text-accent">{biasLabel}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                    <span>Left</span><span>Neutral</span><span>Right</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Sources</div>
                  <div className="space-y-1.5">
                    {article.sources.map((src) => (
                      <div key={src} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-gainn-green flex-shrink-0" />
                        <span className="text-foreground">{src}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-surface-2 rounded p-2">
                      <div className="text-sm font-bold font-mono text-gainn-green">✓</div>
                      <div className="text-[10px] text-muted-foreground">Verified</div>
                    </div>
                    <div className="bg-surface-2 rounded p-2">
                      <div className="text-sm font-bold font-mono text-accent">{isLiveArticle ? "🌐" : "AI"}</div>
                      <div className="text-[10px] text-muted-foreground">{isLiveArticle ? "Live Source" : "AI Authored"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related stories */}
              {sameCategory.length > 0 && (
                <div className="card-glass rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-semibold">Related Stories</span>
                    <span className="ml-auto text-[10px] font-mono text-accent bg-primary/10 px-1.5 py-0.5 rounded">{article.category}</span>
                  </div>
                  <div className="p-3 space-y-3">
                    {sameCategory.map((a) => (
                      <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                        {a.imageUrl && <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />}
                        <div>
                          <p className="text-xs font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m read</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Same region */}
              {sameRegion.length > 0 && (
                <div className="card-glass rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gainn-green" />
                    <span className="text-sm font-semibold">More from {article.region?.split(",")[0]}</span>
                  </div>
                  <div className="p-3 space-y-3">
                    {sameRegion.map((a) => (
                      <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                        {a.imageUrl && <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-gainn-green transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m</span>
                            <span className="text-[10px] font-mono px-1 rounded bg-surface-2 text-muted-foreground">{a.category}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Breaking */}
              {breaking.length > 0 && (
                <div className="card-glass rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-gainn-red" />
                    <span className="text-sm font-semibold">Breaking Now</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-gainn-red">
                      <span className="w-1.5 h-1.5 rounded-full bg-gainn-red animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    {breaking.map((a) => (
                      <Link to={`/article/${a.id}`} state={{ article: a }} key={a.id} className="flex gap-3 group">
                        {a.imageUrl && <img src={a.imageUrl} alt="" className="w-14 h-12 object-cover rounded opacity-70 group-hover:opacity-100 flex-shrink-0 transition-opacity" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-gainn-red transition-colors line-clamp-2 leading-snug">{a.headline}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{a.readTime}m</span>
                            <span className="text-[10px] font-mono px-1 rounded bg-gainn-red/10 text-gainn-red border border-gainn-red/20">{a.category}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile bar ── */}
      {showNext && <StickyMobileBar nextArticle={nextArticle} />}

      {/* ── Email capture ── */}
      <EmailCaptureToast />
    </>
  );
}
