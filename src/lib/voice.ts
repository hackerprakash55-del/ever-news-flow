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
export function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/neural|premium|enhanced|natural|online|studio/.test(n)) s += 100;
    if (/google/.test(n)) s += 50;
    if (/microsoft.*(aria|guy|jenny|davis|tony|emma)/.test(n)) s += 60;
    if (/siri|samantha|daniel|karen|moira|tessa|fiona/.test(n)) s += 40;
    if (v.lang === "en-IN") s += 28;
    else if (/india|ravi|heera|aditi|neerja|prabhat/.test(n)) s += 24;
    else if (v.lang === "en-US") s += 20;
    else if (v.lang === "en-GB") s += 18;
    else if (v.lang?.startsWith("en")) s += 10;
    if (v.localService) s += 2;
    return s;
  };

  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Configure an utterance with premium-sounding defaults — slightly slower
 * pace and a touch warmer pitch for an "anchor" feel.
 */
export function tuneUtterance(utter: SpeechSynthesisUtterance) {
  utter.rate = 0.95;
  utter.pitch = 1.0;
  utter.volume = 1;
  const v = pickBestVoice();
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
