import { createClient } from "npm:@supabase/supabase-js@2";

export const ALLOWED_REDIRECTS = [
  "https://ever-news-flow.lovable.app/auth/youtube/callback",
  "https://id-preview--6345a12e-644b-4c29-b2d4-a5227461b9f6.lovable.app/auth/youtube/callback",
  "http://localhost:8080/auth/youtube/callback",
];

export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/** Exchange the stored refresh token for a fresh short-lived access token. */
export async function getYoutubeAccessToken(): Promise<string> {
  const db = serviceClient();
  const { data } = await db.from("youtube_credentials").select("refresh_token").eq("id", "default").maybeSingle();
  if (!data?.refresh_token) throw new Error("YouTube channel is not connected");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("YOUTUBE_CLIENT_ID")!,
      client_secret: Deno.env.get("YOUTUBE_CLIENT_SECRET")!,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`[${res.status}] Token refresh failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

export function isRenderer(req: Request) {
  const s = Deno.env.get("RENDERER_SECRET") ?? "";
  return !!s && req.headers.get("x-renderer-secret") === s;
}
