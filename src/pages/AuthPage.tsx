import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Radio, Sparkles } from "lucide-react";
import gainnLogo from "@/assets/gainn-logo.png";
import { lovable } from "@/integrations/lovable/index";
import { GainnDemoReel } from "@/components/GainnDemoReel";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "sent" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [googleLoading, setGoogleLoading] = useState(false);

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

    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
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

  async function handleGoogle() {
    setGoogleLoading(true);
    setErrorMsg("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      setErrorMsg(result.error.message ?? "Google sign-in failed. Please try again.");
      setStep("error");
      return;
    }
    if (result.redirected) return;
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--gainn-blue)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gainn-blue)) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className={`relative w-full grid gap-8 items-center ${mode === "signup" ? "max-w-4xl md:grid-cols-2" : "max-w-sm"}`}>
        <div className="w-full max-w-sm mx-auto space-y-6">
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
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-surface-2 border border-border">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-1.5 rounded-md text-xs font-mono uppercase tracking-wide transition-all ${
                      mode === m
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {m === "signin" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-xl font-display text-foreground">
                  {mode === "signin" ? "Sign in to GAINN" : "Create your GAINN account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Continue with Google or get a magic link — no password needed."
                    : "Free forever. Continue with Google or use your email."}
                </p>
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-border bg-surface-2 text-sm font-medium text-foreground hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
                    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
                    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
                    <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
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
                    <><Sparkles className="w-4 h-4" /> {mode === "signin" ? "Send Magic Link" : "Create account with email"}</>
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

        {mode === "signup" && (
          <div className="animate-fade-in">
            <GainnDemoReel />
          </div>
        )}
      </div>
    </div>
  );
}
