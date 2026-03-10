import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const NewsletterBanner = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-surface-1">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 -translate-y-32 translate-x-32 pointer-events-none" />

      <div className="relative px-6 py-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon + copy */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground mb-1">
                The GAINN Daily Brief
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-curated headlines, fact-checked and bias-scored. Delivered at 6 AM, 12 PM & 6 PM.
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-muted-foreground/60">
                <span>✦ 127,000+ subscribers</span>
                <span>·</span>
                <span>✦ No spam</span>
                <span>·</span>
                <span>✦ Unsubscribe anytime</span>
              </div>
            </div>
          </div>

          {/* Form */}
          {submitted ? (
            <div className="flex items-center gap-2 text-gainn-green font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>You're subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full md:w-60 bg-background border-border text-sm"
                required
              />
              <Button type="submit" size="sm" className="h-10 gap-1.5 whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground">
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
