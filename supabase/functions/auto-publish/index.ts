import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_WEBHOOK_URL = Deno.env.get("GITHUB_WEBHOOK_URL")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const DAILY_CAP = parseInt(Deno.env.get("DAILY_AUTO_PUBLISH_CAP") || "5");
const DRY_RUN = Deno.env.get("DRY_RUN") === "true";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function getKillSwitchStatus(): Promise<boolean> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'auto_publish_enabled')
    .single();
  
  if (error) return true; // Default to enabled if setting missing
  return data?.value === true;
}

async function getDailyPublishedCount(date: string): Promise<number> {
  const { count, error } = await supabase
    .from('auto_publish_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${date}T00:00:00Z`)
    .lt('created_at', `${date}T23:59:59Z`)
    .eq('publish_status', 'success');
  
  return count || 0;
}

async function getReadyStories() {
  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      id,
      title,
      content,
      verification_runs!inner(
        id,
        verification_status
      )
    `)
    .eq('verification_runs.verification_status', 'verified')
    .eq('auto_publish_ready', true)
    .order('created_at', { ascending: true })
    .limit(10);
    
  if (error) throw new Error(`Failed to fetch stories: ${error.message}`);
  
  return stories || [];
}

async function logAutoPublish(storyId: string, status: string, errorMsg?: string) {
  await supabase.from('auto_publish_logs').insert({
    story_id: storyId,
    verification_basis: 'verified',
    publish_status: status,
    error_message: errorMsg
  });
}

async function triggerGitHubRender(storyData: any) {
  const payload = {
    event_type: 'render_video',
    client_payload: {
      story: storyData
    }
  };

  const response = await fetch(GITHUB_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`GitHub webhook failed: ${response.status} ${await response.text()}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  try {
    console.log("Auto-publish function invoked");

    // Kill switch check
    const isEnabled = await getKillSwitchStatus();
    if (!isEnabled) {
      console.log("Auto-publish disabled by kill switch");
      return new Response(JSON.stringify({ message: "Auto-publish disabled by kill switch" }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    // Daily cap check
    const today = new Date().toISOString().split('T')[0];
    const publishedToday = await getDailyPublishedCount(today);
    
    console.log(`Published today: ${publishedToday}/${DAILY_CAP}`);
    
    if (publishedToday >= DAILY_CAP) {
      return new Response(JSON.stringify({ 
        message: `Daily cap of ${DAILY_CAP} reached`, 
        published_today: publishedToday 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    // Get ready stories with proper verification
    const readyStories = await getReadyStories();
    const storiesToProcess = readyStories.slice(0, DAILY_CAP - publishedToday);
    
    console.log(`Processing ${storiesToProcess.length} stories`);
    
    const results = [];
    
    for (const story of storiesToProcess) {
      try {
        if (DRY_RUN) {
          console.log(`[DRY RUN] Would process story: ${story.id}`);
          await logAutoPublish(story.id, 'dry_run_skipped', null);
          results.push({
            story_id: story.id,
            status: 'dry_run_skipped',
            message: 'Dry run mode enabled'
          });
          continue;
        }

        // Trigger GitHub Actions render
        await triggerGitHubRender(story);
        
        // Log successful trigger
        await logAutoPublish(story.id, 'triggered', null);
        
        results.push({
          story_id: story.id,
          status: 'processing',
          message: 'Video render triggered via GitHub Actions'
        });
      } catch (error: any) {
        console.error(`Failed to process story ${story.id}:`, error);
        
        // Log failure safely
        await logAutoPublish(story.id, 'failed', error.message);
        
        results.push({
          story_id: story.id,
          status: 'failed',
          error: error.message
        });
        
        continue; // Skip to next story, don't retry indefinitely
      }
    }

    return new Response(JSON.stringify({
      message: "Auto-publish cycle completed",
      results,
      published_today: publishedToday + results.filter(r => r.status !== 'failed').length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Auto-publish function error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
