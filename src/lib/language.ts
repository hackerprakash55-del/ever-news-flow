import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readPublishedTranslations } from "./published-translation";
import { toast } from "sonner";

export interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en-IN", label: "English", native: "English" },
  { code: "hi-IN", label: "Hindi", native: "हिन्दी" },
  { code: "bn-IN", label: "Bengali", native: "বাংলা" },
  { code: "mr-IN", label: "Marathi", native: "मराठी" },
  { code: "ta-IN", label: "Tamil", native: "தமிழ்" },
  { code: "te-IN", label: "Telugu", native: "తెలుగు" },
  { code: "kn-IN", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "Malayalam", native: "മലയാളം" },
  { code: "gu-IN", label: "Gujarati", native: "ગુજરાતી" },
  { code: "pa-IN", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "od-IN", label: "Odia", native: "ଓଡ଼ିଆ" },
];

const STORAGE_KEY = "gainn:lang";
const listeners = new Set<(code: string) => void>();

export function getLanguage(): string {
  if (typeof localStorage === "undefined") return "en-IN";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && LANGUAGES.some((l) => l.code === saved) ? saved : "en-IN";
}

export function setLanguage(code: string) {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* noop */ }
  listeners.forEach((fn) => fn(code));
}

/** Language code shared across narration and translation. */
export function useLanguage(): [string, (code: string) => void] {
  const [lang, setLang] = useState(getLanguage);
  useEffect(() => {
    listeners.add(setLang);
    return () => { listeners.delete(setLang); };
  }, []);
  return [lang, setLanguage];
}

/** Map a language code to a browser SpeechSynthesis locale. */
export function speechLocale(code: string): string {
  return code || "en-IN";
}

/** Translate one or more strings with Sarvam. Falls back to the originals. */
/** True when text is already written mostly in Devanagari (Hindi). */
export function isAlreadyInLanguage(text: string, target: string): boolean {
  if (target !== "hi-IN" || !text) return false;
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return false;
  const deva = letters.filter((c) => /[\u0900-\u097F]/.test(c)).length;
  return deva / letters.length >= 0.5;
}

export async function translateTexts(texts: string[], target: string): Promise<string[]> {
  if (!texts.length || target === "en-IN") return texts;
  const pending = texts.map((t, i) => (isAlreadyInLanguage(t, target) ? -1 : i)).filter((i) => i >= 0);
  if (pending.length < texts.length) {
    if (!pending.length) return texts;
    const done = await translateTexts(pending.map((i) => texts[i]), target);
    const out = [...texts];
    pending.forEach((idx, j) => { out[idx] = done[j]; });
    return out;
  }
  const published = await readPublishedTranslations(texts, target);
  if (published.every((text) => text !== null)) return published.map((text, i) => text ?? texts[i]);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.info(target === "hi-IN" ? "कुछ अनुवाद अभी उपलब्ध नहीं हैं — मूल पाठ दिखाया गया है।" : "Translation not published yet — showing original text.", {
      id: `translation-${target}`, action: { label: "Sign in", onClick: () => { window.location.assign("/auth"); } },
    });
    return published.map((text, i) => text ?? texts[i]);
  }
  // The translate function accepts at most 40 strings per call — send in chunks.
  if (texts.length > 40) {
    const chunks: string[][] = [];
    for (let i = 0; i < texts.length; i += 40) chunks.push(texts.slice(i, i + 40));
    const results = await Promise.all(chunks.map((c) => translateTexts(c, target)));
    return results.flat();
  }
  try {
    const { data, error } = await supabase.functions.invoke("sarvam-translate", {
      body: { texts, target },
    });
    // sarvam-translate returns HTTP 200 even when key is missing; check for explicit error field
    if (error || !Array.isArray(data?.translations) || data?.error) {
      toast.info("Translation unavailable — showing original text.", { id: `translation-${target}` });
      console.warn("Translation unavailable, using original text");
      return texts;
    }
    return data.translations.map((t: unknown, i: number) => (typeof t === "string" && t ? t : texts[i]));
  } catch (err) {
    console.warn("translateTexts failed:", err);
    return texts;
  }
}
