export function hasHindi(text: string): boolean {
  return /[\u0900-\u097f]/u.test(text);
}

/** A Hindi voice setting alone does not translate an English script. */
export async function prepareHindiShort(
  title: string, script: string, key: string | undefined, request: typeof fetch = fetch,
): Promise<{ title: string; script: string; language: "hi-IN" }> {
  const translate = async (text: string) => {
    if (hasHindi(text)) return text;
    if (!key) throw new Error("Hindi translation is not configured; upload stopped.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const response = await request("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "api-subscription-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, source_language_code: "en-IN", target_language_code: "hi-IN", model: "sarvam-translate:v1", mode: "formal" }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) throw new Error(`Hindi translation failed (HTTP ${response.status}); upload stopped.`);
    const data = await response.json();
    if (typeof data.translated_text !== "string" || !hasHindi(data.translated_text)) throw new Error("Hindi translation returned English or empty text; upload stopped.");
    return data.translated_text.trim();
  };
  return { title: await translate(title), script: await translate(script), language: "hi-IN" };
}