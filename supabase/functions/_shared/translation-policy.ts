export const TRANSLATION_BATCH_SIZE = 20;
export async function textHash(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim()));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function publishedTexts(article: { headline: string; summary: string; body: string }): string[] {
  return [article.headline, article.summary, ...article.body.split("\n\n").filter(Boolean)].map((s) => s.trim());
}