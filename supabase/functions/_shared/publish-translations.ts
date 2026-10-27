import { TRANSLATION_BATCH_SIZE, textHash, publishedTexts } from "./translation-policy.ts";

// Called only by authenticated service news refreshes, never public page views.
export async function publishHindiTranslations(svc: any, articles: any[]) {
  const token = crypto.randomUUID();
  const { data: acquired, error: lockError } = await svc.rpc("acquire_news_translation_lease", { token });
  if (lockError || !acquired) return;
  try {
    const key = Deno.env.get("SARVAM_API_KEY");
    if (!key) throw new Error("Translation key missing");
    for (const article of articles.slice(0, TRANSLATION_BATCH_SIZE)) {
      if (!article.url || article.region !== "India") continue;
      const texts = publishedTexts(article);
      // Bound each story's work while retaining only complete source text.
      if (texts.join("").length > 6000 || texts.some((text) => text.length > 900)) continue;
      const contentHash = await textHash(JSON.stringify([article.url, texts]));
      const { error } = await svc.from("news_translation_queue").upsert({
        content_hash: contentHash, source_url: article.url, texts,
      }, { onConflict: "content_hash", ignoreDuplicates: true });
      if (error) throw error;
    }
    const { data: jobs, error } = await svc.from("news_translation_queue").select("content_hash,source_url,texts")
      .eq("status", "pending").order("created_at", { ascending: true }).limit(TRANSLATION_BATCH_SIZE);
    if (error) throw error;
    const deadline = Date.now() + 90_000;
    for (const job of jobs ?? []) {
      if (Date.now() > deadline) break;
      const rows = [];
      for (const text of job.texts as string[]) {
        if (!text) continue;
        const hash = await textHash(text);
        const { data: existing } = await svc.from("published_text_translations").select("text_hash")
          .eq("text_hash", hash).eq("target", "hi-IN").maybeSingle();
        if (existing) continue;
        const response = await fetch("https://api.sarvam.ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-subscription-key": key },
          body: JSON.stringify({ input: text, source_language_code: "en-IN", target_language_code: "hi-IN", model: "sarvam-translate:v1", mode: "formal" }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
          const reason = `Translation provider returned ${response.status}`;
          await svc.from("news_translation_worker").update({ paused_reason: reason,
            paused_until: response.status === 429 || response.status >= 500 ? new Date(Date.now() + 300_000).toISOString() : null,
          }).eq("id", "hindi").eq("lease_token", token);
          return;
        }
        const result = await response.json();
        if (typeof result.translated_text !== "string" || !result.translated_text.trim()) throw new Error("Provider returned no translation");
        rows.push({ text_hash: hash, target: "hi-IN", translated_text: result.translated_text,
          source_content_hash: job.content_hash, source_url: job.source_url });
      }
      if (rows.length) {
        const { error: writeError } = await svc.from("published_text_translations").upsert(rows);
        if (writeError) throw writeError;
      }
      const { error: doneError } = await svc.from("news_translation_queue").update({ status: "completed", completed_at: new Date().toISOString() }).eq("content_hash", job.content_hash);
      if (doneError) throw doneError;
    }
  } catch (error) {
    console.error("Hindi publication failed:", error instanceof Error ? error.message : "Unknown failure");
    await svc.from("news_translation_worker").update({ paused_reason: "Hindi publication failed; inspect function logs", paused_until: new Date(Date.now() + 300_000).toISOString() }).eq("id", "hindi").eq("lease_token", token);
  } finally {
    await svc.from("news_translation_worker").update({ lease_until: new Date().toISOString(), lease_token: null }).eq("id", "hindi").eq("lease_token", token);
  }
}