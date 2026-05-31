import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

const KEY = "gainn_pro_announcement_dismissed";

interface Props {
  onUpgradeClick?: () => void;
}

export function HeroAnnouncementBar({ onUpgradeClick }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { setShow(true); }
  }, []);
  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  }
  if (!show) return null;
  return (
    <div
      className="w-full border-b border-primary/25 text-xs sm:text-sm"
      style={{ background: "linear-gradient(90deg, hsl(192 100% 50% / 0.08), hsl(192 100% 50% / 0.16), hsl(192 100% 50% / 0.08))" }}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center gap-3 px-4 py-2">
        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <p className="flex-1 truncate text-foreground/90">
          <span className="font-semibold">🚀 GAINN Pro is live</span>
          <span className="text-foreground/70"> — Unlimited articles, no ads, AI analysis. </span>
          <span className="text-primary font-semibold">Get 30% off this week</span>
        </p>
        <button
          onClick={onUpgradeClick}
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-[11px] font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:brightness-110 transition-all"
        >
          Upgrade →
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}