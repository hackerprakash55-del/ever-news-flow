import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";
import { requireServiceOrAdmin } from "../_shared/supa.ts";


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

const SITE = "https://ever-news-flow.lovable.app";
const BRAND = "GAINN";

type ContentKind = "article" | "video" | "short" | "broadcast" | "primetime";

const KIND_BADGE: Record<ContentKind, string> = {
  article: "📰",
  video: "🎬 AI VIDEO REPORT:",
  short: "⚡ 60-SEC SHORT:",
  broadcast: "🔴 LIVE BROADCAST:",
  primetime: "🌙 PRIME TIME:",
};

const KIND_CTA: Record<ContentKind, string> = {
  article: "Read full story + AI analysis →",
  video: "Watch the AI video report →",
  short: "Watch the 60-second short →",
  broadcast: "Tune into the live AI newsroom →",
  primetime: "Watch tonight's AI news show →",
};

interface FormatInput {
  headline: string;
  sourceName: string;
  trustScore: number;
  category: string;
  articleUrl: string;
  isBreaking: boolean;
  kind?: ContentKind;
}

const HI_CTA: Record<ContentKind, string> = {
  article: "पूरी खबर पढ़ें →",
  video: "एआई वीडियो रिपोर्ट देखें →",
  short: "60 सेकंड की शॉर्ट देखें →",
  broadcast: "लाइव एआई न्यूज़रूम देखें →",
  primetime: "आज रात का एआई न्यूज़ शो देखें →",
};

function formatTweet(a: FormatInput): string {
  const kind: ContentKind = a.kind ?? "article";
  const isHindi = /[\u0900-\u097F]/.test(a.headline);
  const breaking = a.isBreaking && (a.category === "Politics" || a.category === "Global Affairs");
  const badge = breaking
    ? (isHindi ? "🔴 ब्रेकिंग:" : "🔴 BREAKING:")
    : (kind === "article" ? (CATEGORY_EMOJIS[a.category] || "📰") : KIND_BADGE[kind]);
  const catTag = CATEGORY_TAGS[a.category] || "News";
  const topicWord = a.headline
    .split(/\s+/)
    .find((w) => w.length > 5 && /^[A-Z]/.test(w));
  const topicTag = (topicWord?.replace(/[^a-zA-Z]/g, "") || "News");
  let headline = a.headline.slice(0, 200);
  const trustLine = isHindi
    ? `विश्वसनीयता: ${a.trustScore}% · ✓ एआई सत्यापित · ${a.sourceName}`
    : `Trust: ${a.trustScore}% · ✓ AI Verified · ${a.sourceName}`;
  const cta = `${(isHindi ? HI_CTA : KIND_CTA)[kind]}\n${a.articleUrl}`;
  const brand = `— ${BRAND} · ever-news-flow.lovable.app`;
  const tags = isHindi
    ? `#${BRAND} #हिंदीसमाचार #AINews #${catTag}`
    : `#${BRAND} #AINews #${catTag} #${topicTag}`;
  const build = () => `${badge} ${headline}\n\n${trustLine}\n\n${cta}\n\n${brand}\n${tags}`;
  let tweet = build();
  while (tweet.length > 280 && headline.length > 60) {
    headline = headline.slice(0, -5).trimEnd() + "…";
    tweet = build();
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

// ── Candidate collection ──────────────────────────────────────────────────
type Candidate = FormatInput & { id: string; kind: ContentKind };

async function collectCandidates(supa: any, hours: number): Promise<Candidate[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const out: Candidate[] = [];

  // 1. AI video reports
  const { data: videos } = await supa
    .from("generated_videos")
    .select("id,title,category,created_at")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(10);
  for (const v of videos ?? []) {
    out.push({
      id: v.id,
      kind: "video",
      headline: v.title,
      sourceName: BRAND,
      trustScore: 90,
      category: v.category || "Global Affairs",
      articleUrl: `${SITE}/video-library`,
      isBreaking: false,
    });
  }

  // 2. Published verified stories → articles + shorts
  const { data: runs } = await supa
    .from("verification_runs")
    .select("id,topic,story_headline,consensus_score,published,published_at")
    .eq("published", true)
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(10);
  for (const r of runs ?? []) {
    const headline = r.story_headline || r.topic;
    if (!headline) continue;
    out.push({
      id: r.id,
      kind: "article",
      headline,
      sourceName: BRAND,
      trustScore: Math.round((Number(r.consensus_score) || 0.9) * 100),
      category: "Global Affairs",
      articleUrl: `${SITE}/`,
      isBreaking: false,
    });
    out.push({
      id: `${r.id}:short`,
      kind: "short",
      headline,
      sourceName: BRAND,
      trustScore: Math.round((Number(r.consensus_score) || 0.9) * 100),
      category: "Global Affairs",
      articleUrl: `${SITE}/shorts`,
      isBreaking: false,
    });
  }

  // 3. Live broadcast story segments
  const { data: segs } = await supa
    .from("broadcast_segments")
    .select("id,kind,created_at,event_cluster_id,event_clusters(label)")
    .eq("kind", "story")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(5);
  for (const s of segs ?? []) {
    const label = s.event_clusters?.label;
    if (!label) continue;
    out.push({
      id: s.id,
      kind: "broadcast",
      headline: label,
      sourceName: BRAND,
      trustScore: 92,
      category: "Global Affairs",
      articleUrl: `${SITE}/newsroom`,
      isBreaking: true,
    });
  }

  return out;
}

async function publish(supa: any, c: Candidate) {
  const tweetText = formatTweet(c);
  const { data: pending, error: insErr } = await supa
    .from("twitter_posts")
    .insert({
      article_id: c.id,
      kind: c.kind,
      tweet_text: tweetText,
      headline: c.headline,
      source_name: c.sourceName,
      trust_score: c.trustScore,
      category: c.category,
      article_url: c.articleUrl,
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
    return { ok: true, kind: c.kind, id: c.id, tweet_id: result?.data?.id ?? null, text: tweetText };
  } catch (err) {
    await supa.from("twitter_posts").update({
      status: "failed",
      error_message: (err as Error).message.slice(0, 500),
    }).eq("id", pending.id);
    return { ok: false, kind: c.kind, id: c.id, error: (err as Error).message.slice(0, 300) };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Only the cron job (service-role bearer) or an admin JWT may publish to
  // the official X account. Everyone else is rejected before any posting.
  const auth = await requireServiceOrAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });


  try {
    let body: any = {};
    if (req.method === "POST") body = await req.json().catch(() => ({}));

    // Explicit single post (e.g. "share this to X" from the app/admin).
    if (body?.article) {
      const a = body.article as Candidate;
      const result = await publish(supa, { ...a, kind: (a.kind ?? "article") as ContentKind });
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hours = Math.min(24, Math.max(1, Number(body?.hours ?? 3)));
    const limit = Math.min(6, Math.max(1, Number(body?.limit ?? 3)));
    const kinds: ContentKind[] | null = Array.isArray(body?.kinds) && body.kinds.length
      ? body.kinds
      : null;

    const all = await collectCandidates(supa, hours);
    const { data: posted } = await supa
      .from("twitter_posts").select("article_id").eq("status", "posted");
    const postedSet = new Set((posted ?? []).map((r: any) => r.article_id));

    // One per kind first (variety), then fill remaining slots.
    const fresh = all.filter((c) => !postedSet.has(c.id) && (!kinds || kinds.includes(c.kind)));
    const seenKinds = new Set<string>();
    const primary = fresh.filter((c) => {
      if (seenKinds.has(c.kind)) return false;
      seenKinds.add(c.kind);
      return true;
    });
    const queue = [...primary, ...fresh.filter((c) => !primary.includes(c))].slice(0, limit);

    if (!queue.length) {
      return new Response(JSON.stringify({ ok: true, message: "No new content to post", posted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];
    for (const c of queue) {
      results.push(await publish(supa, c));
      await new Promise((r) => setTimeout(r, 1200)); // gentle pacing for X rate limits
    }

    return new Response(JSON.stringify({
      ok: results.some((r) => r.ok),
      posted: results.filter((r) => r.ok).length,
      results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("twitter-post error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});