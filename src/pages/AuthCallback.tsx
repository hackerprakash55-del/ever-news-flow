import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Universal auth landing page.
 * Handles: PKCE (?code=), implicit (#access_token=), and error params from
 * magic links / Google OAuth. Then forwards to the intended destination.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const nextParam = url.searchParams.get("next");
      const next = nextParam && /^\/(?!\/)/.test(nextParam) ? nextParam : "/";

      const errDesc =
        url.searchParams.get("error_description") ?? hash.get("error_description");
      if (errDesc) {
        if (!cancelled) setError(errDesc);
        return;
      }

      // 1. PKCE code flow
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setError(error.message);
          return;
        }
      } else {
        // 2. Implicit flow — set the session directly from the hash tokens
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error && !cancelled) {
            setError(error.message);
            return;
          }
        }
      }

      // Confirm we actually have a session before leaving this page
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setError("This sign-in link has expired or was already used. Please request a new one.");
        return;
      }
      window.history.replaceState({}, "", next);
      navigate(next, { replace: true });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {error ? (
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4 border border-border">
          <p className="text-sm text-gainn-red">{error}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="w-full py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-foreground hover:bg-white/5 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Signing you in…</p>
        </div>
      )}
    </div>
  );
}
