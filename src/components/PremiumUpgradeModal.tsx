import { useEffect } from "react";
import { X, Check, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    popular: false,
    features: ["5 articles per day", "Basic search", "Public news feed", "Email newsletter"],
    cta: "Continue Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    popular: true,
    features: [
      "Unlimited articles",
      "No ads, ever",
      "AI Morning Briefing",
      "Bookmarks & reading history",
      "Multi-perspective analysis",
      "Voice playback (all articles)",
    ],
    cta: "Start 7-Day Free Trial",
  },
  {
    name: "Business",
    price: "$29",
    period: "/ month",
    popular: false,
    features: [
      "Everything in Pro",
      "API access",
      "5 team seats",
      "Editor dashboard",
      "Priority support",
      "Custom news alerts",
    ],
    cta: "Contact Sales",
  },
];

export function PremiumUpgradeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-glass relative w-full max-w-5xl rounded-2xl p-6 sm:p-10 my-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 chip-soft px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary mb-3">
            <Sparkles className="w-3 h-3" /> Premium Access
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2">
            Unlock the full power of GAINN
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Pick a plan that fits how you read. Cancel anytime. 7-day free trial on Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-xl p-6 flex flex-col bg-white/[0.03] border transition-all hover:translate-y-[-4px] ${
                t.popular
                  ? "border-primary shadow-[0_0_30px_rgba(0,212,255,0.18)]"
                  : "border-white/10"
              }`}
              style={t.popular ? { borderColor: "#00D4FF", borderWidth: 1 } : undefined}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold text-primary-foreground bg-primary">
                  Most Popular
                </div>
              )}
              <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">{t.name}</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-display font-bold text-foreground">{t.price}</span>
                <span className="text-xs text-muted-foreground">{t.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${t.popular ? "text-primary" : "text-foreground/50"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all ${
                  t.popular
                    ? "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_24px_rgba(0,212,255,0.4)]"
                    : "bg-white/5 text-foreground hover:bg-white/10 border border-white/10"
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] font-mono text-muted-foreground mt-6">
          Secured by GAINN · Cancel anytime · Used by 14,200+ readers
        </p>
      </div>
    </div>
  );
}