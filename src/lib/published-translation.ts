import { supabase } from "@/integrations/supabase/client";

export async function translationHash(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim()));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function readPublishedTranslations(texts: string[], target: string): Promise<Array<string | null>> {
  const hashes = await Promise.all(texts.map(translationHash));
  const values = new Map<string, string>();
  for (let i = 0; i < hashes.length; i += 40) {
    const { data, error } = await supabase.from("published_text_translations")
      .select("text_hash,translated_text").eq("target", target).in("text_hash", hashes.slice(i, i + 40));
    if (error) break;
    for (const row of data ?? []) values.set(row.text_hash, row.translated_text);
  }
  return hashes.map((hash) => values.get(hash) ?? null);
}