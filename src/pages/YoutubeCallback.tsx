import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

/**
 * YouTube OAuth Callback Handler
 * 
 * This page captures the OAuth token from YouTube/Google after user consent.
 * The token is stored in localStorage and used for subsequent API calls.
 * 
 * URL format after consent:
 * /auth/youtube/callback#access_token=YA29...&token_type=Bearer&expires_in=3599&scope=...
 */
export default function YoutubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // YouTube OAuth returns the token in the URL hash (fragment), not query params
    const hash = window.location.hash.substring(1); // Remove leading #
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get("access_token");
    const error = params.get("error");

    if (error) {
      console.error("YouTube OAuth error:", error);
      return;
    }

    if (accessToken) {
      // Store token in localStorage for future use
      localStorage.setItem("youtube_oauth_token", accessToken);
      
      // Optionally extract expiry time
      const expiresIn = params.get("expires_in");
      if (expiresIn) {
        const expiryTime = Date.now() + parseInt(expiresIn, 10) * 1000;
        localStorage.setItem("youtube_oauth_token_expiry", expiryTime.toString());
      }

      // Redirect to the review queue page
      setTimeout(() => {
        navigate("/shorts-review-queue");
      }, 2000);
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            YouTube Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your YouTube account has been successfully connected. You will be redirected to the Shorts Review Queue shortly.
            </AlertDescription>
          </Alert>
          
          <p className="mt-4 text-sm text-muted-foreground">
            You can now approve and upload Shorts directly to your YouTube channel from the review queue.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
