// Uploads a rendered Short to the connected YouTube channel using the
// server-held refresh token. Callers: the scheduled renderer (x-renderer-secret) or an admin.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAdmin } from "../_shared/supa.ts";
import { getYoutubeAccessToken, isRenderer, serviceClient } from "../_shared/youtube.ts";

const SITE = "https://ever-news-flow.lovable.app";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function b64ToBytes(b64: string) {
  const bin = atob(b64.includes(",") ? b64.split(",")[1] : b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Set the story's real photo as the YouTube thumbnail. Non-fatal: if the photo
// is missing or the upload fails, YouTube keeps its auto-generated frame.
async function setThumbnail(accessToken: string, videoId: string, imageUrl: string | null): Promise<boolean> {
  if (!imageUrl || !imageUrl.startsWith("http")) return false;
  try {
    const img = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; GAINN/1.0)" } });
    if (!img.ok) return false;
    const type = img.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return false;
    const bytes = new Uint8Array(await img.arrayBuffer());
    if (bytes.length < 10_000 || bytes.length > 2_000_000) return false; // YouTube: min 640px, max 2MB
    const up = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": type.split(";")[0] }, body: bytes },
    );
    if (!up.ok) console.error("thumbnail set failed", up.status, (await up.text()).slice(0, 300));
    return up.ok;
  } catch (e) {
    console.error("thumbnail error", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = serviceClient();
  let queueId: string | null = null;
  try {
    if (!isRenderer(req)) {
      const a = await requireAdmin(req.headers.get("Authorization") ?? "");
      if (!a.ok) return json({ error: a.error }, a.status);
    }
    const { queueItemId, videoBase64, mimeType = "video/mp4" } = await req.json();
    if (typeof queueItemId !== "string" || typeof videoBase64 !== "string") {
      return json({ error: "queueItemId and videoBase64 are required" }, 400);
    }
    queueId = queueItemId;
    const { data: item } = await db.from("youtube_publish_queue").select("*").eq("id", queueItemId).maybeSingle();
    if (!item) return json({ error: "Queue item not found" }, 404);
    if (item.status === "uploaded") return json({ success: true, youtubeUrl: item.youtube_url, already: true });

    const accessToken = await getYoutubeAccessToken();
    const hi = item.language === "hi-IN";
    const description = [
      item.script,
      "",
      item.source_name ? `${hi ? "स्रोत" : "Source"}: ${item.source_name}` : "",
      item.source_url ? `${hi ? "मूल रिपोर्ट" : "Original report"}: ${item.source_url}` : "",
      hi ? "AI-सहायता से तैयार · स्रोत दिखाया गया" : "AI-assisted summary · source shown · corrections welcome",
      `${hi ? "और खबरें" : "More news"}: ${SITE}`,
      "",
      hi ? "#GAINN #हिंदीसमाचार #Shorts" : "#GAINN #IndiaNews #Shorts",
    ].filter(Boolean).join("\n");

    const metadata = {
      snippet: { title: item.title.slice(0, 95), description: description.slice(0, 4900), categoryId: "25", tags: ["GAINN", "India news", "news shorts"], defaultLanguage: hi ? "hi" : "en" },
      status: { privacyStatus: Deno.env.get("YOUTUBE_PRIVACY") || "public", selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
    };

    const boundary = "gainn" + crypto.randomUUID();
    const video = b64ToBytes(videoBase64);
    const enc = new TextEncoder();
    const head = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const tail = enc.encode(`\r\n--${boundary}--`);
    const payload = new Uint8Array(head.length + video.length + tail.length);
    payload.set(head, 0); payload.set(video, head.length); payload.set(tail, head.length + video.length);

    const yt = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: payload,
    });
    if (!yt.ok) {
      const t = await yt.text();
      throw new Error(`[${yt.status}] YouTube upload failed: ${t.slice(0, 800)}`);
    }
    const result = await yt.json();
    const url = `https://youtube.com/shorts/${result.id}`;
    const now = new Date().toISOString();
    await db.from("youtube_publish_queue").update({ status: "uploaded", youtube_video_id: result.id, youtube_url: url, uploaded_at: now, updated_at: now, error_message: null }).eq("id", item.id);
    await db.from("published_shorts").insert({ article_id: item.article_id, article_url: item.source_url, youtube_video_id: result.id, youtube_video_url: url, published_at: now, status: "success" });
    return json({ success: true, youtubeVideoId: result.id, youtubeUrl: url });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("youtube-upload error:", msg);
    if (queueId) {
      const { data: row } = await db.from("youtube_publish_queue").select("attempts").eq("id", queueId).maybeSingle();
      const attempts = (row?.attempts ?? 0) + 1;
      await db.from("youtube_publish_queue").update({ status: attempts >= 3 ? "failed" : "queued", attempts, error_message: msg.slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", queueId);
    }
    return json({ success: false, error: msg }, 500);
  }
});
