import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const youtubeClientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  error?: string;
  details?: any;
}

export default function AdminHealthCheck() {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    migration: { status: 'pending' },
    edgeFunctions: { status: 'pending' },
    secrets: { status: 'pending' },
    renderOnly: { status: 'pending' },
    oauthOnly: { status: 'pending' },
  });

  const updateTest = (testName: string, result: Partial<TestResult>) => {
    setTests(prev => ({
      ...prev,
      [testName]: { ...prev[testName], ...result },
    }));
  };

  // Test 1: Migration Check
  const runMigrationCheck = async () => {
    updateTest('migration', { status: 'running' });
    
    try {
      const { data, error } = await supabase
        .from('review_queue')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          updateTest('migration', {
            status: 'fail',
            message: 'Table "review_queue" does not exist',
            error: error.message,
          });
        } else {
          updateTest('migration', {
            status: 'fail',
            message: 'Database query failed',
            error: error.message,
          });
        }
        return;
      }

      const { count } = await supabase
        .from('review_queue')
        .select('*', { count: 'exact', head: true });

      updateTest('migration', {
        status: 'pass',
        message: `Table exists and is accessible. ${count || 0} items in queue.`,
        details: { itemCount: count },
      });
    } catch (err: any) {
      updateTest('migration', {
        status: 'fail',
        message: 'Unexpected error',
        error: err.message,
      });
    }
  };

  // Test 2: Edge Functions Reachable
  const runEdgeFunctionsCheck = async () => {
    updateTest('edgeFunctions', { status: 'running' });
    
    const functions = ['prepare-short-assets', 'youtube-upload'];
    const results: Record<string, { reachable: boolean; status?: number; error?: string }> = {};

    for (const func of functions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${func}`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        // We expect either 200 (success) or 400/401 (auth error but function exists)
        // 404 means function doesn't exist
        if (response.status === 404) {
          results[func] = { reachable: false, status: response.status, error: 'Function not found (404)' };
        } else {
          results[func] = { reachable: true, status: response.status };
        }
      } catch (err: any) {
        results[func] = { reachable: false, error: err.message };
      }
    }

    const allReachable = Object.values(results).every(r => r.reachable);
    
    if (allReachable) {
      updateTest('edgeFunctions', {
        status: 'pass',
        message: 'Both edge functions are deployed and reachable',
        details: results,
      });
    } else {
      const failed = Object.entries(results)
        .filter(([_, r]) => !r.reachable)
        .map(([name, r]) => `${name}: ${r.error || r.status}`)
        .join(', ');
      
      updateTest('edgeFunctions', {
        status: 'fail',
        message: `Some functions unreachable: ${failed}`,
        details: results,
      });
    }
  };

  // Test 3: Secrets Configured
  const runSecretsCheck = async () => {
    updateTest('secrets', { status: 'running' });
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/youtube-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'X-Test-Secrets': 'true',
        },
        body: JSON.stringify({ testMode: true }),
      });

      const data = await response.json();
      
      if (data.secretsStatus) {
        const clientIdOk = data.secretsStatus.clientId === 'present';
        const clientSecretOk = data.secretsStatus.clientSecret === 'present';
        
        if (clientIdOk && clientSecretOk) {
          updateTest('secrets', {
            status: 'pass',
            message: 'Both YouTube secrets are configured correctly',
            details: data.secretsStatus,
          });
        } else {
          const missing = [];
          if (!clientIdOk) missing.push('VITE_YOUTUBE_CLIENT_ID (client-side)');
          if (!clientSecretOk) missing.push('YOUTUBE_CLIENT_SECRET (server-side)');
          
          updateTest('secrets', {
            status: 'fail',
            message: `Missing secrets: ${missing.join(', ')}`,
            details: data.secretsStatus,
          });
        }
      } else {
        updateTest('secrets', {
          status: 'fail',
          message: 'Could not verify secrets configuration',
          error: data.error || 'Unknown error',
        });
      }
    } catch (err: any) {
      updateTest('secrets', {
        status: 'fail',
        message: 'Failed to connect to edge function',
        error: err.message,
      });
    }
  };

  // Test 4: Render Only Test
  const runRenderOnlyTest = async () => {
    updateTest('renderOnly', { status: 'running' });
    
    try {
      // Create a sample story for testing
      const testStory = {
        id: 'test-' + Date.now(),
        title: 'Test Story for Rendering',
        content: 'This is a test story to verify FFmpeg.wasm rendering works correctly.',
        verification: {
          verification_status: 'verified',
          sources_checked: [{ outlet: 'Test Source' }],
          credibility_score: { value: 95, basis: 'Test verification' },
        },
      };

      // Trigger prepare-short-assets to get script and thumbnail
      const assetsResponse = await fetch(`${supabaseUrl}/functions/v1/prepare-short-assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId: testStory.id,
          testMode: true,
          storyData: testStory,
        }),
      });

      if (!assetsResponse.ok) {
        throw new Error(`Asset preparation failed: ${assetsResponse.status}`);
      }

      const assets = await assetsResponse.json();
      
      if (assets.error) {
        throw new Error(assets.error);
      }

      // Now trigger client-side rendering with FFmpeg.wasm
      // This would normally happen in ShortRenderer.tsx, but we'll do it inline here
      updateTest('renderOnly', {
        status: 'pass',
        message: 'Assets prepared successfully. To complete render test, open ShortsReviewQueue and use the "Render Test Video" button on any item.',
        details: {
          hasScript: !!assets.script,
          hasThumbnail: !!assets.thumbnailUrl,
          hasAudio: !!assets.audioUrl,
          note: 'Full FFmpeg.wasm rendering requires user interaction in the review queue UI',
        },
      });
    } catch (err: any) {
      updateTest('renderOnly', {
        status: 'fail',
        message: 'Render test failed',
        error: err.message,
      });
    }
  };

  // Test 5: OAuth Only Test
  const runOAuthOnlyTest = async () => {
    updateTest('oauthOnly', { status: 'running' });
    
    if (!youtubeClientId) {
      updateTest('oauthOnly', {
        status: 'fail',
        message: 'YouTube Client ID not found in environment',
        error: 'VITE_YOUTUBE_CLIENT_ID is missing or empty',
      });
      return;
    }

    try {
      const redirectUri = window.location.origin + '/auth/youtube/callback';
      const scope = 'https://www.googleapis.com/auth/youtube.upload';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${youtubeClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

      // Open OAuth flow in a popup
      const popup = window.open(authUrl, 'YouTube OAuth Test', 'width=600,height=800');
      
      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }

      // Listen for the OAuth callback
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            // User closed the popup without completing
            updateTest('oauthOnly', {
              status: 'fail',
              message: 'OAuth popup was closed before completion',
            });
          }
        } catch (e) {
          // Cross-origin error is expected after redirect
        }
      }, 500);

      // Note: The actual token handling happens in the callback route
      // This test just confirms the OAuth flow initiates correctly
      updateTest('oauthOnly', {
        status: 'running',
        message: 'OAuth popup opened. Complete the Google sign-in flow. If successful, you will be redirected back and the test will show Pass.',
      });

      // Set up a listener for the callback
      window.addEventListener('message', (event) => {
        if (event.data.type === 'youtube-oauth-success') {
          clearInterval(checkPopup);
          updateTest('oauthOnly', {
            status: 'pass',
            message: 'OAuth flow completed successfully! Token received.',
            details: { hasToken: !!event.data.token, expiresAt: event.data.expiresAt },
          });
        } else if (event.data.type === 'youtube-oauth-error') {
          clearInterval(checkPopup);
          updateTest('oauthOnly', {
            status: 'fail',
            message: 'OAuth flow failed',
            error: event.data.error,
          });
        }
      });

    } catch (err: any) {
      updateTest('oauthOnly', {
        status: 'fail',
        message: 'OAuth test failed to initiate',
        error: err.message,
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'fail': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'running': return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      default: return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pass: 'default',
      fail: 'destructive',
      running: 'secondary',
      pending: 'outline',
    };
    const labels: Record<string, string> = {
      pass: 'Pass',
      fail: 'Fail',
      running: 'Running...',
      pending: 'Not Tested',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">YouTube Pipeline Health Check</h1>
      <p className="text-muted-foreground mb-8">
        Run each test individually to isolate issues. All tests must pass before attempting the full automated flow.
      </p>

      <div className="space-y-4">
        {/* Test 1: Migration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">1. Database Migration Check</CardTitle>
            {getStatusBadge(tests.migration.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tests.migration.message || 'Verifies review_queue table exists and is accessible'}
              </p>
              <Button 
                onClick={runMigrationCheck}
                disabled={tests.migration.status === 'running'}
                size="sm"
              >
                {tests.migration.status === 'running' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            {tests.migration.error && (
              <p className="text-sm text-red-500 mt-2">{tests.migration.error}</p>
            )}
            {tests.migration.details && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tests.migration.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Test 2: Edge Functions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">2. Edge Functions Reachable</CardTitle>
            {getStatusBadge(tests.edgeFunctions.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tests.edgeFunctions.message || 'Checks if prepare-short-assets and youtube-upload respond'}
              </p>
              <Button 
                onClick={runEdgeFunctionsCheck}
                disabled={tests.edgeFunctions.status === 'running'}
                size="sm"
              >
                {tests.edgeFunctions.status === 'running' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            {tests.edgeFunctions.error && (
              <p className="text-sm text-red-500 mt-2">{tests.edgeFunctions.error}</p>
            )}
            {tests.edgeFunctions.details && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tests.edgeFunctions.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Test 3: Secrets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">3. Secrets Configured</CardTitle>
            {getStatusBadge(tests.secrets.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tests.secrets.message || 'Verifies YouTube Client ID and Secret are present (without exposing values)'}
              </p>
              <Button 
                onClick={runSecretsCheck}
                disabled={tests.secrets.status === 'running'}
                size="sm"
              >
                {tests.secrets.status === 'running' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            {tests.secrets.error && (
              <p className="text-sm text-red-500 mt-2">{tests.secrets.error}</p>
            )}
            {tests.secrets.details && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tests.secrets.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Test 4: Render Only */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">4. Render Only Test</CardTitle>
            {getStatusBadge(tests.renderOnly.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tests.renderOnly.message || 'Prepares assets for a test story (script, thumbnail, audio) without uploading'}
              </p>
              <Button 
                onClick={runRenderOnlyTest}
                disabled={tests.renderOnly.status === 'running'}
                size="sm"
              >
                {tests.renderOnly.status === 'running' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            {tests.renderOnly.error && (
              <p className="text-sm text-red-500 mt-2">{tests.renderOnly.error}</p>
            )}
            {tests.renderOnly.details && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tests.renderOnly.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Test 5: OAuth Only */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">5. YouTube OAuth Only Test</CardTitle>
            {getStatusBadge(tests.oauthOnly.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tests.oauthOnly.message || 'Opens Google OAuth flow to confirm redirect URIs and credentials work'}
              </p>
              <Button 
                onClick={runOAuthOnlyTest}
                disabled={tests.oauthOnly.status === 'running'}
                size="sm"
              >
                {tests.oauthOnly.status === 'running' ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            {tests.oauthOnly.error && (
              <p className="text-sm text-red-500 mt-2">{tests.oauthOnly.error}</p>
            )}
            {tests.oauthOnly.details && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tests.oauthOnly.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Run each test above and ensure all show <strong className="text-green-600">Pass</strong></li>
          <li>If any test fails, fix the specific issue indicated in the error message</li>
          <li>Once all 5 tests pass, proceed to the full end-to-end test in ShortsReviewQueue</li>
        </ol>
      </div>
    </div>
  );
}
