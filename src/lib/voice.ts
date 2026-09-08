/**
 * Centralized "best available" voice picker for the Web Speech API.
 * Ranks installed system voices and returns the highest-quality match.
 *
 * Ordering (best → fallback):
 *  1. Premium / neural cloud voices (Google, Microsoft Online, Apple Siri, Premium)
 *  2. High-quality named voices (Daniel, Samantha, Karen, Aria, Guy, Jenny)
 *  3. Any Indian-English / en-US / en-GB voice
 *  4. First English voice
 */
export function pickBestVoice(lang = "en-IN"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const base = (lang || "en-IN").split("-")[0].toLowerCase();
  const wantsEnglish = base === "en";

  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    const vl = (v.lang || "").replace("_", "-");
    let s = 0;
    // Indian-language mode: a voice in the requested language wins outright.
    if (!wantsEnglish) {
      if (vl.toLowerCase() === lang.toLowerCase()) s += 500;
      else if (vl.toLowerCase().startsWith(base)) s += 400;
      else if (vl === "en-IN") s += 30; // best-effort accent if no native voice
    }
    if (/neural|premium|enhanced|natural|online|studio/.test(n)) s += 100;
    if (/google/.test(n)) s += 50;
    if (/microsoft.*(aria|guy|jenny|davis|tony|emma|swara|madhur|kalpana|hemant)/.test(n)) s += 60;
    if (/siri|samantha|daniel|karen|moira|tessa|fiona|lekha/.test(n)) s += 40;
    if (vl === "en-IN") s += 28;
    else if (/india|ravi|heera|aditi|neerja|prabhat/.test(n)) s += 24;
    else if (vl === "en-US") s += 20;
    else if (vl === "en-GB") s += 18;
    else if (vl.startsWith("en")) s += 10;
    if (v.localService) s += 2;
    return s;
  };

  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Configure an utterance with premium-sounding defaults — slightly slower
 * pace and a touch warmer pitch for an "anchor" feel.
 */
export function tuneUtterance(utter: SpeechSynthesisUtterance, lang = "en-IN") {
  utter.rate = 0.95;
  utter.pitch = 1.0;
  utter.volume = 1;
  utter.lang = lang || "en-IN";
  const v = pickBestVoice(lang);
  if (v) utter.voice = v;
}

/**
 * Voices load asynchronously in some browsers. Resolves once the list is
 * available, or immediately if already loaded.
 */
export function waitForVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    if (window.speechSynthesis.getVoices().length) return resolve();
    const onChange = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Safety timeout
    setTimeout(resolve, 1200);
  });
}
