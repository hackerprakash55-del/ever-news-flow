import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiApiKey = OPENROUTER_API_KEY ?? LOVABLE_API_KEY;
    if (!aiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY and LOVABLE_API_KEY are not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const aiEndpoint = OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiModel = OPENROUTER_API_KEY
      ? "deepseek/deepseek-chat:free"
      : "google/gemini-3-flash-preview";

    const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
    const { topic, category, event_cluster_id } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const svc = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;

    // ── Phase 4: pull verified claims + entities from the knowledge layer ──
    let verifiedClaims: Array<{ id: string; claim_text: string; confidence: number }> = [];
    let topEntities: Array<{ name: string; type: string }> = [];
    let clusterRow: { id: string; label: string; summary: string | null } | null = null;
    if (svc) {
      try {
        if (event_cluster_id) {
          const { data: c } = await svc
            .from("event_clusters")
            .select("id, label, summary, claim_ids, entity_ids")
            .eq("id", event_cluster_id)
            .maybeSingle();
          if (c) {
            clusterRow = { id: c.id, label: c.label, summary: c.summary };
            if (c.claim_ids?.length) {
              const { data: cs } = await svc
                .from("claims")
                .select("id, claim_text, confidence")
                .in("id", c.claim_ids)
                .order("confidence", { ascending: false })
                .limit(10);
              verifiedClaims = cs ?? [];
            }
            if (c.entity_ids?.length) {
              const { data: es } = await svc
                .from("entities")
                .select("name, type")
                .in("id", c.entity_ids)
                .order("salience", { ascending: false })
                .limit(8);
              topEntities = es ?? [];
            }
          }
        } else if (topic) {
          const { data: cs } = await svc
            .from("claims")
            .select("id, claim_text, confidence")
            .ilike("topic", `%${topic}%`)
            .eq("status", "verified")
            .order("confidence", { ascending: false })
            .limit(10);
          verifiedClaims = cs ?? [];
        }
      } catch (e) {
        console.warn("knowledge fetch failed:", (e as Error).message);
      }
    }

    // 1. Fetch latest headlines for the topic/category
    let headlines: string[] = [];
    let articleSummaries: string[] = [];

    if (NEWSAPI_KEY) {
      const q = topic || category || "world news";
      const newsUrl = `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&q=${encodeURIComponent(q)}&apiKey=${NEWSAPI_KEY}`;
      try {
        const newsRes = await fetch(newsUrl);
        const newsData = await newsRes.json();
        if (newsData.articles) {
          headlines = newsData.articles
            .filter((a: any) => a.title && a.title !== "[Removed]")
            .slice(0, 8)
            .map((a: any) => a.title);
          articleSummaries = newsData.articles
            .filter((a: any) => a.description && a.description !== "[Removed]")
            .slice(0, 5)
            .map((a: any) => `- ${a.title}: ${a.description}`);
        }
      } catch (e) {
        console.error("NewsAPI fetch failed:", e);
      }
    }

    const topicLabel = topic || category || "Global Affairs";
    const claimsBlock = verifiedClaims.length
      ? `\n\nVerified claims from GAINN's knowledge graph (confidence-ordered):\n${verifiedClaims.map((c, i) => `${i + 1}. [${c.confidence.toFixed(2)}] ${c.claim_text}`).join("\n")}`
      : "";
    const entitiesBlock = topEntities.length
      ? `\n\nKey entities: ${topEntities.map((e) => `${e.name} (${e.type})`).join(", ")}`
      : "";
    const clusterBlock = clusterRow
      ? `\n\nEvent cluster: "${clusterRow.label}"${clusterRow.summary ? ` — ${clusterRow.summary}` : ""}`
      : "";
    const headlineContext = headlines.length > 0
      ? `\n\nLive headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nSummaries:\n${articleSummaries.join("\n")}`
      : "";

    const systemPrompt = `You are GAINN's senior AI news anchor and scriptwriter. You produce professional, multi-format video news content for the Global AI News Network.

STRICT EDITORIAL RULES:
- Always present MULTIPLE perspectives on every issue — never favor one side
- Use neutral, factual, precise language — no emotional or politically charged words
- Cite sources and regions whenever possible
- Acknowledge uncertainty with phrases like "according to reports", "officials say", "sources indicate"
- End every segment with context, not conclusions
- Prefer verified claims from the knowledge graph when available
- Structure long-form: Opening Hook → Background → Key Developments → Multiple Viewpoints → Global Impact → Closing Context

FORMAT YOUR OUTPUT EXACTLY LIKE THIS:
[TITLE]: The video title
[DURATION]: Estimated duration in minutes
[CATEGORY]: News category
[THUMBNAIL_PROMPT]: A cinematic, photorealistic image description for the video thumbnail (no text, no faces)
[SCRIPT]:
The full anchor script with clear section headers like **OPENING**, **BACKGROUND**, **KEY DEVELOPMENTS**, **PERSPECTIVES**, **GLOBAL IMPACT**, **CLOSING**
[SHORT_SCRIPT]:
A vertical 60-second hook-driven script for TikTok/Reels/Shorts (≤180 words, single voice, punchy).
[SOCIAL_CAPTION]:
A single ≤280-character social post with one neutral hashtag.
[NEWSLETTER_MD]:
A 120-180 word markdown newsletter blurb with a bolded lede and a "**What's next**" bullet line.

Each section should be substantial (150-300 words). Total script should be 800-1200 words for a 6-10 minute video.`;

    const userPrompt = `Create a multi-format news package about: "${topicLabel}"${clusterBlock}${claimsBlock}${entitiesBlock}${headlineContext}

Make it a 6-10 minute deep-dive video that covers all sides of the story with global context. The tone should be authoritative but accessible, like a premium documentary news channel.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    const requestAi = (endpoint: string, key: string, model: string) => fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    let aiRes = await requestAi(aiEndpoint, aiApiKey, aiModel);
    if (!aiRes.ok && OPENROUTER_API_KEY && LOVABLE_API_KEY) {
      console.warn(`OpenRouter returned ${aiRes.status}; using Lovable AI fallback`);
      aiRes = await requestAi(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        LOVABLE_API_KEY,
        "google/gemini-3-flash-preview",
      );
    }

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached — please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required — please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const rawScript = aiData.choices?.[0]?.message?.content || "";

    // Parse structured fields from the script
    const titleMatch = rawScript.match(/\[TITLE\]:\s*(.+)/);
    const durationMatch = rawScript.match(/\[DURATION\]:\s*(.+)/);
    const categoryMatch = rawScript.match(/\[CATEGORY\]:\s*(.+)/);
    const thumbnailMatch = rawScript.match(/\[THUMBNAIL_PROMPT\]:\s*(.+)/);
    const scriptMatch = rawScript.match(/\[SCRIPT\]:\s*([\s\S]+?)(?=\n\[SHORT_SCRIPT\]:|\n\[SOCIAL_CAPTION\]:|\n\[NEWSLETTER_MD\]:|$)/);
    const shortMatch = rawScript.match(/\[SHORT_SCRIPT\]:\s*([\s\S]+?)(?=\n\[SOCIAL_CAPTION\]:|\n\[NEWSLETTER_MD\]:|$)/);
    const socialMatch = rawScript.match(/\[SOCIAL_CAPTION\]:\s*([\s\S]+?)(?=\n\[NEWSLETTER_MD\]:|$)/);
    const newsletterMatch = rawScript.match(/\[NEWSLETTER_MD\]:\s*([\s\S]+)$/);

    const result = {
      title: titleMatch?.[1]?.trim() || `GAINN Report: ${topicLabel}`,
      duration: durationMatch?.[1]?.trim() || "6-8 min",
      category: categoryMatch?.[1]?.trim() || topicLabel,
      thumbnailPrompt: thumbnailMatch?.[1]?.trim() || `Cinematic global news broadcast studio, ${topicLabel}, dramatic lighting, professional news set`,
      script: scriptMatch?.[1]?.trim() || rawScript,
      shortScript: shortMatch?.[1]?.trim() || null,
      socialCaption: socialMatch?.[1]?.trim() || null,
      newsletterMd: newsletterMatch?.[1]?.trim() || null,
      rawHeadlines: headlines,
      verifiedClaimIds: verifiedClaims.map((c) => c.id),
      eventClusterId: clusterRow?.id ?? null,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-video-script error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
