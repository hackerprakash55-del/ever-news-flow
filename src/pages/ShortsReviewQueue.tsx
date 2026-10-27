import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Youtube } from "lucide-react";
import { useState } from "react";
import EditorialShortsQueue from "@/components/EditorialShortsQueue";

export default function ShortsReviewQueue() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const redirectUri = `${window.location.origin}/auth/youtube/callback`;

  const status = useQuery({
    queryKey: ["youtubeStatus"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("youtube-oauth", { body: { action: "status", redirectUri } });
      if (error) throw error;
      return data as { connected: boolean; channel: { channel_title: string | null; connected_at: string } | null };
    },
  });

  const queue = useQuery({
    queryKey: ["youtubeQueue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("youtube_publish_queue").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });

  const call = async (action: string) => {
    setBusy(true); setError("");
    const { data, error } = await supabase.functions.invoke("youtube-oauth", { body: { action, redirectUri } });
    setBusy(false);
    if (error || data?.error) { setError(data?.error || "Request failed — admin access is required."); return; }
    if (action === "start" && data?.url) window.location.href = data.url;
    else qc.invalidateQueries({ queryKey: ["youtubeStatus"] });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">YouTube Shorts publishing</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Youtube className="h-5 w-5" /> Channel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {status.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : status.data?.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Connected</Badge>
              <span>{status.data.channel?.channel_title ?? "Your channel"}</span>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => call("disconnect")}>Disconnect</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">Not connected</Badge>
              <Button disabled={busy} onClick={() => call("start")}>Connect YouTube channel</Button>
            </div>
          )}
          {status.isError && <p className="text-sm text-destructive">Couldn't load channel status — admin access is required.</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-sm text-muted-foreground">
            Approved stories are narrated in Hindi and uploaded every four hours (max 5 per day).
          </p>
        </CardContent>
      </Card>

      <EditorialShortsQueue />

      <Card>
        <CardHeader><CardTitle>Recent Shorts</CardTitle></CardHeader>
        <CardContent>
          {queue.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : !queue.data?.length ? (
            <p className="text-sm text-muted-foreground">No Shorts yet. The first one appears after the next scheduled run.</p>
          ) : (
            <ul className="divide-y divide-border">
              {queue.data.map((q) => (
                <li key={q.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">{q.source_name ?? "Source"} · {new Date(q.created_at).toLocaleString("en-IN")}</p>
                    {q.error_message && q.status !== "uploaded" && <p className="text-xs text-destructive truncate">{q.error_message}</p>}
                  </div>
                  <Badge variant={q.status === "uploaded" ? "default" : q.status === "failed" ? "destructive" : "secondary"}>{q.status}</Badge>
                  {q.youtube_url && (
                    <a href={q.youtube_url} target="_blank" rel="noreferrer" className="text-primary text-sm inline-flex items-center gap-1">
                      Watch <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
