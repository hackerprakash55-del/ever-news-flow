import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // CORS headers for preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Test-Secrets",
      },
    });
  }

  try {
    // Special test mode for secrets check
    const isTestMode = req.headers.get("X-Test-Secrets") === "true";
    if (isTestMode) {
      const clientId = Deno.env.get("YOUTUBE_CLIENT_ID") || Deno.env.get("VITE_YOUTUBE_CLIENT_ID");
      const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
      
      return new Response(
        JSON.stringify({
          success: true,
          secretsStatus: {
            clientId: clientId ? "present" : "missing",
            clientSecret: clientSecret ? "present" : "missing",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify admin access
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: admin access required");
    }

    const { queueItemId, videoBase64, mimeType = "video/mp4" } = await req.json();
    
    if (!queueItemId || !videoBase64) {
      throw new Error("queueItemId and videoBase64 are required");
    }

    // Fetch queue item to get video metadata
    const { data: queueItem, error: queueError } = await supabaseClient
      .from("review_queue")
      .select(`
        *,
        generated_videos (
          id,
          title,
          social_caption
        ),
        verification_runs (
          id,
          verification_status,
          consensus_score
        )
      `)
      .eq("id", queueItemId)
      .single();

    if (queueError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // Double-check verification status before upload
    if (!queueItem.verification_runs || queueItem.verification_runs.length === 0) {
      throw new Error("Cannot upload: no verification record exists");
    }

    const verification = queueItem.verification_runs[0];
    if (verification.verification_status !== "verified") {
      throw new Error(`Cannot upload: verification status is "${verification.verification_status}"`);
    }

    const video = queueItem.generated_videos;
    if (!video) {
      throw new Error("No associated video content found");
    }

    // Get YouTube OAuth token from request (passed by client after OAuth flow)
    const youtubeToken = req.headers.get("X-Youtube-Token");
    if (!youtubeToken) {
      throw new Error("YouTube OAuth token required in X-Youtube-Token header");
    }

    // Prepare video metadata for YouTube
    const title = `[Short] ${video.title}`;
    const description = buildYouTubeDescription(video, verification);
    const tags = generateTags(video.category, verification);

    // Convert base64 video to blob for upload
    const videoBlob = base64ToBlob(videoBase64, mimeType);

    // Create FormData for YouTube API multipart upload
    const formData = new FormData();
    
    const metadata = {
      snippet: {
        title: title,
        description: description,
        categoryId: "25", // News & Politics
        tags: tags,
      },
      status: {
        privacyStatus: "public", // Or "private" / "unlisted" based on preference
      },
    };

    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", videoBlob, "short.mp4");

    // Upload to YouTube Data API v3
    const youtubeResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${youtubeToken}`,
        },
        body: formData,
      }
    );

    if (!youtubeResponse.ok) {
      const errorBody = await youtubeResponse.text();
      console.error("YouTube API error:", errorBody);
      throw new Error(`YouTube upload failed: ${youtubeResponse.status} ${errorBody}`);
    }

    const youtubeResult = await youtubeResponse.json();
    
    // Update queue item with posted timestamp and YouTube video ID
    const { error: updateError } = await supabaseClient
      .from("review_queue")
      .update({
        approved_at: queueItem.approved_at || new Date().toISOString(),
        posted_at: new Date().toISOString(),
        platform_post_id: youtubeResult.id,
        platform_url: `https://youtube.com/shorts/${youtubeResult.id}`,
      })
      .eq("id", queueItemId);

    if (updateError) {
      console.error("Failed to update queue status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        youtubeVideoId: youtubeResult.id,
        youtubeUrl: `https://youtube.com/shorts/${youtubeResult.id}`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("youtube-upload error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

function buildYouTubeDescription(video: any, verification: any): string {
  const sourcesCount = verification.sources_checked?.length || 0;
  const score = Math.round((verification.consensus_score || 0) * 100);
  
  let description = `${video.social_caption || ""}\n\n`;
  description += `🔍 AI-Verified: ${sourcesCount} sources checked, ${score}% consensus\n`;
  description += `Sources: ${verification.sources_checked?.map((s: any) => s.outlet).join(", ") || "Multiple"}\n\n`;
  description += `#AINews #Verified #Shorts #${(video.category || "News").replace(/\s/g, "")}`;
  
  return description;
}

function generateTags(category?: string, verification?: any): string[] {
  const baseTags = ["AI news", "verified news", "AI verified", "news shorts"];
  const categoryTag = category ? [category] : [];
  const sourceTags = verification?.sources_checked?.slice(0, 3).map((s: any) => s.outlet) || [];
  
  return [...baseTags, ...categoryTag, ...sourceTags].filter(Boolean);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(",")[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
