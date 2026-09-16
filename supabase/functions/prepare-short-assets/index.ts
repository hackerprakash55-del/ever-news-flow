import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // CORS headers for preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
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

    const { queueItemId } = await req.json();
    if (!queueItemId) {
      throw new Error("queueItemId required");
    }

    // Fetch queue item with verification status
    const { data: queueItem, error: queueError } = await supabaseClient
      .from("review_queue")
      .select(`
        *,
        generated_videos (
          id,
          title,
          script,
          short_script,
          social_caption,
          thumbnail_url,
          category,
          event_cluster_id
        ),
        verification_runs (
          id,
          verification_status,
          consensus_score,
          sources_checked
        )
      `)
      .eq("id", queueItemId)
      .single();

    if (queueError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // CRITICAL: Only proceed if verification exists and completed successfully
    if (!queueItem.verification_runs || queueItem.verification_runs.length === 0) {
      throw new Error("Cannot prepare assets: no verification record exists for this story");
    }

    const verification = queueItem.verification_runs[0];
    if (verification.verification_status !== "verified") {
      throw new Error(
        `Cannot prepare assets: verification status is "${verification.verification_status}", must be "verified"`
      );
    }

    const video = queueItem.generated_videos;
    if (!video) {
      throw new Error("No associated video content found");
    }

    // Extract short script (fallback to full script if short not available)
    let scriptText = video.short_script || video.script;
    if (!scriptText) {
      throw new Error("No script content available");
    }

    // Strip markdown formatting like [SHORT_SCRIPT], [SOCIAL_CAPTION], etc.
    scriptText = scriptText
      .replace(/\[SHORT_SCRIPT\]/g, "")
      .replace(/\[SCRIPT\]/g, "")
      .replace(/\[SOCIAL_CAPTION\]/g, "")
      .trim();

    // Generate TTS audio using existing Sarvam/ElevenLabs functions
    const ttsProvider = Deno.env.get("DEFAULT_TTS_PROVIDER") || "elevenlabs";
    const ttsEndpoint = ttsProvider === "sarvam"
      ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/sarvam-tts`
      : `${Deno.env.get("SUPABASE_URL")}/functions/v1/elevenlabs-tts`;

    const ttsResponse = await fetch(ttsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        text: scriptText,
        language: queueItem.language || "en",
      }),
    });

    if (!ttsResponse.ok) {
      console.error("TTS generation failed:", await ttsResponse.text());
      throw new Error("Failed to generate audio narration");
    }

    const audioBlob = await ttsResponse.blob();
    
    // Convert audio to base64 for client-side use
    const audioBase64 = await blobToBase64(audioBlob);

    // Prepare asset package for client-side rendering
    const assets = {
      queueItemId: queueItem.id,
      videoId: video.id,
      title: video.title,
      script: scriptText,
      caption: video.social_caption || "",
      thumbnailUrl: video.thumbnail_url,
      audioBase64: audioBase64,
      category: video.category,
      verificationStatus: verification.verification_status,
      consensusScore: verification.consensus_score,
      sourcesCount: verification.sources_checked?.length || 0,
    };

    return new Response(JSON.stringify({ success: true, assets }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("prepare-short-assets error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
