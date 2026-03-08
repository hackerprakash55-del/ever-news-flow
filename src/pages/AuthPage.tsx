import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Radio, Sparkles } from "lucide-react";
import gainnLogo from "@/assets/gainn-logo.png";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "sent" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? "/";

  // Already logged in → redirect
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setIsLoading(false);
    if (error) {
      setErrorMsg(error.message);
      setStep("error");
    } else {
      setStep("sent");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--gainn-blue)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gainn-blue)) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <img src={gainnLogo} alt="GAINN" className="w-10 h-10 object-contain" />
            <div className="text-left">
              <div className="text-xl font-bold text-gradient-primary" style={{ fontFamily: "var(--font-display)" }}>GAINN</div>
              <div className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-mono -mt-0.5">Global AI News Network</div>
            </div>
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-gainn-green">
            <div className="w-1.5 h-1.5 rounded-full bg-gainn-green animate-pulse" />
            <Radio className="w-3 h-3" />
            108 AI Agents Live
          </div>
        </div>

        {/* Card */}
        <div className="card-glass rounded-2xl p-8 space-y-6 border border-border">
          {step === "input" && (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-display text-foreground">Sign in to GAINN</h1>
                <p className="text-sm text-muted-foreground">We'll email you a magic link — no password needed.</p>
              </div>

              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground font-mono uppercase tracking-wide">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gainn-blue/40 focus:border-gainn-blue/50 transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-gainn-blue hover:bg-gainn-blue/90 text-white gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Send Magic Link</>
                  )}
                </Button>
              </form>

              <p className="text-center text-[11px] text-muted-foreground">
                New users are automatically registered on first sign in.
              </p>
            </>
          )}

          {step === "sent" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-gainn-green/15 border border-gainn-green/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-gainn-green" />
              </div>
              <div>
                <h2 className="text-lg font-display text-foreground mb-1">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a magic link to <span className="text-foreground font-medium">{email}</span>.
                  Click it to sign in instantly.
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Didn't receive it?{" "}
                <button onClick={() => setStep("input")} className="text-gainn-blue hover:text-gainn-cyan transition-colors">
                  Try again
                </button>
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gainn-red/15 border border-gainn-red/30 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-gainn-red" />
                </div>
                <p className="text-sm text-gainn-red">{errorMsg}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep("input")}>
                ← Try Again
              </Button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to GAINN
          </Link>
        </div>
      </div>
    </div>
  );
}
