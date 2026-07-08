import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Tweet formatter ───────────────────────────────────────────────────────
const CATEGORY_EMOJIS: Record<string, string> = {
  Technology: "💻", Economy: "📈", Science: "🔬", Health: "🏥",
  Environment: "🌍", AI: "🤖", Sports: "⚽", Politics: "🗳️",
  "Global Affairs": "🌐",
};
const CATEGORY_TAGS: Record<string, string> = {
  Technology: "BreakingTech", Economy: "Markets", Science: "Science",
  Health: "Health", Environment: "ClimateNews",
  AI: "ArtificialIntelligence", Politics: "IndiaNews",
  "Global Affairs": "WorldNews", Sports: "Sports",
};

interface FormatInput {
  headline: string;
  sourceName: string;
  trustScore: number;
  category: string;
  articleUrl: string;
  isBreaking: boolean;
}

function formatTweet(a: FormatInput): string {
  const breaking = a.isBreaking && (a.category === "Politics" || a.category === "Global Affairs");
  const badge = breaking ? "🔴 BREAKING:" : (CATEGORY_EMOJIS[a.category] || "📰");
  const catTag = CATEGORY_TAGS[a.category] || "News";
  const topicWord = a.headline
    .split(/\s+/)
    .find((w) => w.length > 5 && /^[A-Z]/.test(w));
  const topicTag = (topicWord?.replace(/[^a-zA-Z]/g, "") || "News");
  let headline = a.headline.slice(0, 200);
  const trustLine = `Trust: ${a.trustScore}% · ✓ AI Verified · ${a.sourceName}`;
  const cta = `Read full story + AI analysis →\n${a.articleUrl}`;
  const tags = `#GAINN #AINews #${catTag} #${topicTag}`;
  let tweet = `${badge} ${headline}\n\n${trustLine}\n\n${cta}\n\n${tags}`;
  while (tweet.length > 280 && headline.length > 60) {
    headline = headline.slice(0, -5).trimEnd() + "…";
    tweet = `${badge} ${headline}\n\n${trustLine}\n\n${cta}\n\n${tags}`;
  }
  return tweet;
}

// ── OAuth 1.0a signing for POST /2/tweets ─────────────────────────────────
function percentEncode(s: string) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) =>
    "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function oauthHeader(method: string, url: string, params: Record<string, string>, keys: {
  consumerKey: string; consumerSecret: string; token: string; tokenSecret: string;
}) {
  const oauth = {
    oauth_consumer_key: keys.consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: keys.token,
    oauth_version: "1.0",
  } as Record<string, string>;
  const all = { ...params, ...oauth };
  const paramStr = Object.keys(all).sort().map((k) => `${percentEncode(k)}=${percentEncode(all[k])}`).join("&");
  const base = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramStr)}`;
  const signingKey = `${percentEncode(keys.consumerSecret)}&${percentEncode(keys.tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(base).digest("base64");
  oauth.oauth_signature = signature;
  const header = "OAuth " + Object.keys(oauth).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauth[k])}"`).join(", ");
  return header;
}

async function postTweet(text: string) {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET");
  const token = Deno.env.get("TWITTER_ACCESS_TOKEN");
  const tokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) {
    throw new Error("Twitter credentials not configured");
  }
  const url = "https://api.x.com/2/tweets";
  // For JSON POST bodies, OAuth signature excludes body params.
  const auth = oauthHeader("POST", url, {}, {
    consumerKey, consumerSecret, token, tokenSecret,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Twitter ${res.status}: ${body}`);
  return JSON.parse(body);
}

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    let article: FormatInput & { id: string; slug?: string } | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.article) article = body.article;
    }

    // Auto-pick highest trust generated_video in last 2h that hasn't been posted
    if (!article) {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supa
        .from("generated_videos")
        .select("id,title,category,created_at")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: posted } = await supa
        .from("twitter_posts").select("article_id").eq("status", "posted");
      const postedSet = new Set((posted ?? []).map((r: any) => r.article_id));
      const pick = (recent ?? []).find((r: any) => !postedSet.has(r.id));
      if (!pick) {
        return new Response(JSON.stringify({ ok: true, message: "No new article to tweet" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      article = {
        id: pick.id,
        headline: pick.title,
        sourceName: "GAINN",
        trustScore: 90,
        category: pick.category || "Global Affairs",
        articleUrl: `https://ever-news-flow.lovable.app/article/${pick.id}`,
        isBreaking: false,
      };
    }

    const tweetText = formatTweet(article);

    const { data: pending, error: insErr } = await supa
      .from("twitter_posts")
      .insert({
        article_id: article.id,
        tweet_text: tweetText,
        headline: article.headline,
        source_name: article.sourceName,
        trust_score: article.trustScore,
        category: article.category,
        article_url: article.articleUrl,
        status: "pending",
      })
      .select("id").single();
    if (insErr) throw insErr;

    try {
      const result = await postTweet(tweetText);
      await supa.from("twitter_posts").update({
        status: "posted",
        tweet_id: result?.data?.id ?? null,
        posted_at: new Date().toISOString(),
      }).eq("id", pending.id);
      return new Response(JSON.stringify({ ok: true, tweet: result, text: tweetText }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      await supa.from("twitter_posts").update({
        status: "failed",
        error_message: (err as Error).message.slice(0, 500),
      }).eq("id", pending.id);
      throw err;
    }
  } catch (err) {
    console.error("twitter-post error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});