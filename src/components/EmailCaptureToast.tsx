import { useState, useEffect } from "react";
import { Mail, X, Check } from "lucide-react";

const STORAGE_KEY = "gainn_email_captured";
const TRIGGER_KEY = "gainn_article_finished";

/** Call this when user reaches bottom of an article (scroll >= 90%). */
export function markArticleFinished() {
  try { localStorage.setItem(TRIGGER_KEY, "true"); } catch {}
}

export function EmailCaptureToast() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Already subscribed or dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Poll for the trigger
    const interval = setInterval(() => {
      if (localStorage.getItem(TRIGGER_KEY) && !localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  function dismiss() {
    setVisible(false);
  }

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    localStorage.setItem(STORAGE_KEY, email);
    setSubscribed(true);
    setTimeout(() => setVisible(false), 2000);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4 animate-fade-in"
      role="dialog"
      aria-label="Newsletter signup"
    >
      <div className="rounded-xl border border-border shadow-elevated overflow-hidden"
        style={{ background: "hsl(222 28% 9%)" }}>
        {/* Accent bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />

        <div className="p-4">
          {subscribed ? (
            <div className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gainn-green/15 border border-gainn-green/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-gainn-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">You're in! 🎉</p>
                <p className="text-xs text-muted-foreground">First briefing arrives tomorrow at 7 AM.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Enjoying GAINN?</p>
                    <p className="text-xs text-muted-foreground">Get the top 5 stories every morning</p>
                  </div>
                </div>
                <button onClick={dismiss} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 flex-shrink-0"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  Subscribe
                </button>
              </form>
              <p className="text-[10px] text-muted-foreground/60 mt-2">No spam. Unsubscribe anytime.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
