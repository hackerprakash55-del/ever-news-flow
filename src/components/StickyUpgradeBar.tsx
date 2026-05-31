import { useEffect, useState } from "react";
import { X, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const KEY = "gainn_sticky_upgrade_dismissed";

interface Props {
  onUpgradeClick?: () => void;
}

export function StickyUpgradeBar({ onUpgradeClick }: Props) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(KEY)) setDismissed(true); } catch {}
  }, []);

  useEffect(() => {
    if (user || dismissed) return;
    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total > 0.5) setVisible(true);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, dismissed]);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setDismissed(true);
    setVisible(false);
  }

  if (user || dismissed || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex justify-center pointer-events-none animate-fade-in">
      <div className="pointer-events-auto card-glass rounded-full pl-4 pr-2 py-2 flex items-center gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)] border-primary/30 max-w-2xl w-full">
        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="flex-1 text-xs sm:text-sm text-foreground/90 truncate">
          You're reading for free —
          <span className="text-primary font-semibold"> Upgrade to Pro</span>
          <span className="hidden sm:inline text-foreground/70"> for unlimited access</span>
        </p>
        <button
          onClick={onUpgradeClick}
          className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold font-mono uppercase tracking-wider hover:brightness-110 transition-all flex-shrink-0"
        >
          Upgrade
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}