import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";

const supabase = createClient();

interface QueueItem {
  id: string;
  created_at: string;
  approved_at: string | null;
  posted_at: string | null;
  platform_status: string;
  platform_url: string | null;
  youtube_upload_error: string | null;
  generated_videos: {
    id: string;
    title: string;
    short_script: string | null;
    script: string;
    social_caption: string | null;
    thumbnail_url: string | null;
    category: string | null;
  } | null;
  verification_runs: Array<{
    id: string;
    verification_status: string;
    consensus_score: number;
    sources_checked: Array<{ outlet: string }>;
  }>;
}

export default function ShortsReviewQueue() {
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [renderingState, setRenderingState] = useState<"idle" | "preparing" | "rendering" | "uploading" | "complete" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [youtubeToken, setYoutubeToken] = useState<string>("");
  
  const queryClient = useQueryClient();

  // Fetch pending queue items (only verified, not yet posted)
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["reviewQueueShorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_queue")
        .select(`
          *,
          generated_videos (
            id,
            title,
            short_script,
            script,
            social_caption,
            thumbnail_url,
            category
          ),
          verification_runs (
            id,
            verification_status,
            consensus_score,
            sources_checked
          )
        `)
        .eq("platform_status", "pending")
        .not("approved_at", "is", null)
        .is("posted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as QueueItem[];
    },
  });

  // Approve and trigger YouTube upload
  const approveAndUploadMutation = useMutation({
    mutationFn: async (queueItemId: string) => {
      setRenderingState("preparing");
      setErrorMessage("");

      // Step 1: Prepare assets (generates TTS audio)
      const prepareResponse = await fetch(
        `${supabase.functionsUrl}/v1/prepare-short-assets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ queueItemId }),
        }
      );

      const prepareResult = await prepareResponse.json();
      if (!prepareResult.success) {
        throw new Error(prepareResult.error || "Failed to prepare assets");
      }

      const assets = prepareResult.assets;
      setRenderingState("rendering");

      // Step 2: Client-side video rendering with FFmpeg.wasm
      const videoBlob = await renderShortVideo(assets);
      
      setRenderingState("uploading");

      // Convert video to base64 for upload
      const videoBase64 = await blobToBase64(videoBlob);

      // Step 3: Upload to YouTube via edge function
      const uploadResponse = await fetch(
        `${supabase.functionsUrl}/v1/youtube-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "X-Youtube-Token": youtubeToken,
          },
          body: JSON.stringify({
            queueItemId,
            videoBase64,
            mimeType: "video/mp4",
          }),
        }
      );

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "YouTube upload failed");
      }

      setRenderingState("complete");
      return uploadResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewQueueShorts"] });
      setSelectedItem(null);
      setRenderingState("idle");
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Upload failed");
      setRenderingState("error");
    },
  });

  // Check for YouTube OAuth token on mount
  useEffect(() => {
    const token = localStorage.getItem("youtube_oauth_token");
    if (token) {
      setYoutubeToken(token);
    }
  }, []);

  const handleApproveAndUpload = (item: QueueItem) => {
    if (!youtubeToken) {
      setErrorMessage("YouTube authorization required. Please connect your YouTube account first.");
      return;
    }
    setSelectedItem(item);
    approveAndUploadMutation.mutate(item.id);
  };

  const initiateYouTubeOAuth = () => {
    // YouTube OAuth 2.0 flow - user will be redirected to Google consent screen
    const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
    const redirectUri = window.location.origin + "/auth/youtube/callback";
    const scope = "https://www.googleapis.com/auth/youtube.upload";
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    window.open(authUrl, "_blank", "width=600,height=800");
    
    // Note: After user consents, the token will be captured in the callback page
    // and stored in localStorage under 'youtube_oauth_token'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading queue...</span>
      </div>
    );
  }

  if (!queueItems || queueItems.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Shorts Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                No pending Shorts in the queue. All verified Shorts have been uploaded to YouTube.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Shorts Review Queue</h1>

      {!youtubeToken && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            YouTube authorization required.{" "}
            <Button variant="link" onClick={initiateYouTubeOAuth} className="p-0 h-auto">
              Connect your YouTube account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {queueItems.map((item) => {
          const verification = item.verification_runs[0];
          const sourcesCount = verification?.sources_checked?.length || 0;
          const consensusScore = Math.round((verification?.consensus_score || 0) * 100);

          return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{item.generated_videos?.title || "Untitled Short"}</span>
                  <Badge variant={verification?.verification_status === "verified" ? "default" : "secondary"}>
                    {verification?.verification_status === "verified" 
                      ? `✓ Verified (${consensusScore}% consensus)` 
                      : verification?.verification_status || "Unverified"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Category:</strong> {item.generated_videos?.category || "General"}
                    </div>
                    <div>
                      <strong>Sources Checked:</strong> {sourcesCount}
                    </div>
                    <div className="col-span-2">
                      <strong>Sources:</strong>{" "}
                      {verification?.sources_checked?.map((s, i) => s.outlet).join(", ") || "None"}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Short Script (60 seconds):</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {item.generated_videos?.short_script || item.generated_videos?.script || "No script available"}
                    </p>
                  </div>

                  {item.generated_videos?.social_caption && (
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Social Caption:</h4>
                      <p className="text-sm">{item.generated_videos.social_caption}</p>
                    </div>
                  )}

                  {item.generated_videos?.thumbnail_url && (
                    <div>
                      <h4 className="font-semibold mb-2">Thumbnail:</h4>
                      <img
                        src={item.generated_videos.thumbnail_url}
                        alt="Thumbnail"
                        className="w-48 h-27 object-cover rounded border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(item.generated_videos!.thumbnail_url!, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Thumbnail
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApproveAndUpload(item)}
                      disabled={!youtubeToken || renderingState !== "idle" || approveAndUploadMutation.isPending}
                      className="flex-1"
                    >
                      {approveAndUploadMutation.isPending && selectedItem?.id === item.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {renderingState === "preparing" && "Preparing assets..."}
                          {renderingState === "rendering" && "Rendering video..."}
                          {renderingState === "uploading" && "Uploading to YouTube..."}
                          {renderingState === "complete" && "Upload complete!"}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Upload to YouTube
                        </>
                      )}
                    </Button>
                  </div>

                  {item.platform_url && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <a
                        href={item.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-green-700 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on YouTube: {item.platform_url}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Client-side video rendering using FFmpeg.wasm
async function renderShortVideo(assets: any): Promise<Blob> {
  // Dynamically import FFmpeg.wasm to avoid bundling it in the main bundle
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  
  // Load FFmpeg.wasm core
  await ffmpeg.load({
    coreURL: await fetchFile("https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js"),
  });

  // Write audio file (from base64)
  const audioData = atob(assets.audioBase64.split(",")[1]);
  const audioArray = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    audioArray[i] = audioData.charCodeAt(i);
  }
  await ffmpeg.writeFile("audio.mp3", audioArray);

  // Download and write thumbnail image
  const thumbnailResponse = await fetch(assets.thumbnailUrl);
  const thumbnailBlob = await thumbnailResponse.blob();
  const thumbnailArray = new Uint8Array(await thumbnailBlob.arrayBuffer());
  await ffmpeg.writeFile("thumbnail.jpg", thumbnailArray);

  // Create a simple video from the image with audio
  // This creates a static image video with the audio duration
  await ffmpeg.exec([
    "-loop", "1",
    "-i", "thumbnail.jpg",
    "-i", "audio.mp3",
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black",
    "-shortest",
    "-movflags", "+faststart",
    "output.mp4"
  ]);

  // Read the output file
  const outputData = await ffmpeg.readFile("output.mp4");
  const outputBlob = new Blob([outputData], { type: "video/mp4" });

  return outputBlob;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
