import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAdmin } from "../_shared/supa.ts";
import { ALLOWED_REDIRECTS, serviceClient } from "../_shared/youtube.ts";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req.headers.get("Authorization") ?? "");
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const { action, redirectUri, code } = await req.json().catch(() => ({}));
    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return json({ error: "YouTube app credentials missing" }, 500);
    const db = serviceClient();

    if (action === "status") {
      const { data } = await db.from("youtube_credentials").select("channel_title, channel_id, connected_at").eq("id", "default").maybeSingle();
      return json({ connected: !!data, channel: data ?? null });
    }

    if (action === "disconnect") {
      await db.from("youtube_credentials").delete().eq("id", "default");
      return json({ connected: false });
    }

    if (typeof redirectUri !== "string" || !ALLOWED_REDIRECTS.includes(redirectUri)) {
      return json({ error: "Redirect address not allowed" }, 400);
    }

    if (action === "start") {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
      }).toString();
      return json({ url: url.toString() });
    }

    if (action === "exchange") {
      if (typeof code !== "string" || code.length < 10) return json({ error: "Missing code" }, 400);
      const tokRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tok = await tokRes.json();
      if (!tokRes.ok) return json({ error: "Google rejected the sign-in", details: tok }, tokRes.status);
      if (!tok.refresh_token) return json({ error: "Google did not return a long-lived token. Remove GAINN's access in your Google account and connect again." }, 400);

      let channel_id: string | null = null, channel_title: string | null = null;
      const ch = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      });
      if (ch.ok) {
        const c = await ch.json();
        channel_id = c.items?.[0]?.id ?? null;
        channel_title = c.items?.[0]?.snippet?.title ?? null;
      }
      const { error } = await db.from("youtube_credentials").upsert({
        id: "default", refresh_token: tok.refresh_token, channel_id, channel_title,
        connected_by: auth.userId, connected_at: new Date().toISOString(),
      });
      if (error) throw error;
      return json({ connected: true, channel: { channel_id, channel_title } });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("youtube-oauth error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
