import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
export async function translateTexts(texts: string[], target: string): Promise<string[]> {
  if (!texts.length || target === "en-IN") return texts;
  try {
    const { data, error } = await supabase.functions.invoke("sarvam-translate", {
      body: { texts, target },
    });
    if (error || !Array.isArray(data?.translations)) return texts;
    return data.translations.map((t: unknown, i: number) => (typeof t === "string" && t ? t : texts[i]));
  } catch (err) {
    console.warn("translateTexts failed:", err);
    return texts;
  }
}
