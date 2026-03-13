import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "gainn_articles_viewed";
const PROMPT_SHOWN_KEY = "gainn_soft_prompt_shown";
const THRESHOLD = 2; // show after viewing 2 articles

/** Call this whenever a user opens an article (even without being signed in). */
export function trackArticleView() {
  if (typeof window === "undefined") return;
  const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  localStorage.setItem(STORAGE_KEY, String(count + 1));
}

export function getArticleViewCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
}

/** Floating soft sign-in nudge — mounts globally, self-manages visibility. */
export function SoftSignInPrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) return; // already signed in — never show
    if (localStorage.getItem(PROMPT_SHOWN_KEY)) return; // already shown once

    // Poll localStorage for article view count
    const interval = setInterval(() => {
      if (getArticleViewCount() >= THRESHOLD) {
        setVisible(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  function dismiss() {
    localStorage.setItem(PROMPT_SHOWN_KEY, "true");
    setVisible(false);
  }

  function goSignIn() {
    localStorage.setItem(PROMPT_SHOWN_KEY, "true");
    navigate("/auth");
  }

  if (!visible || user) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 animate-fade-in"
      role="dialog"
      aria-label="Sign in prompt"
    >
      <div
        className="rounded-xl border border-accent/30 shadow-elevated overflow-hidden"
        style={{ background: "hsl(222 28% 10%)" }}
      >
        {/* Accent top bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))" }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-sm font-semibold text-foreground">Enjoying GAINN?</span>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Sign in to <span className="text-foreground font-medium">save articles</span>, get a personalised feed, and never miss a breaking story.
          </p>

          {/* Perks */}
          <div className="flex items-center gap-3 mb-4">
            {[
              { icon: "🔖", label: "Save articles" },
              { icon: "🎯", label: "Your feed" },
              { icon: "🔔", label: "Alerts" },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-1 flex-1 text-center">
                <span className="text-base">{p.icon}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{p.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-2">
            <button
              onClick={goSignIn}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-accent-foreground transition-colors"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
            >
              <Bookmark className="w-3 h-3" />
              Sign in free
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border border-border"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
