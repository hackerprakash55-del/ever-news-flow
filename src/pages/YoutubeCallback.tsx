import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/** Receives Google's authorization code and hands it to the backend, which stores a renewable token. */
export default function YoutubeCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Connecting your YouTube channel…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");
    if (err || !code) {
      setState("error");
      setMessage(err ? `Google said: ${err}` : "No authorization code was returned.");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("youtube-oauth", {
        body: { action: "exchange", code, redirectUri: `${window.location.origin}/auth/youtube/callback` },
      });
      if (error || !data?.connected) {
        let details = data?.error || error?.message || "Connection failed";
        try { details = (await (error as any)?.context?.json())?.error ?? details; } catch { /* ignore */ }
        setState("error");
        setMessage(details);
        return;
      }
      setState("done");
      setMessage(`Connected to ${data.channel?.channel_title ?? "your channel"}. Scheduled Shorts will now upload automatically.`);
      setTimeout(() => navigate("/shorts-review-queue"), 2500);
    })();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state === "working" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {state === "done" && <CheckCircle className="h-6 w-6 text-primary" />}
            {state === "error" && <AlertCircle className="h-6 w-6 text-destructive" />}
            YouTube
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{message}</p></CardContent>
      </Card>
    </div>
  );
}
