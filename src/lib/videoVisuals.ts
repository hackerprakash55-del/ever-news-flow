export const VIDEO_CATEGORY_GRADIENTS: Record<string, string> = {
  Economy: "linear-gradient(135deg, #0f2027 0%, #2c5364 100%)",
  Politics: "linear-gradient(135deg, #1a0505 0%, #6b0000 100%)",
  Technology: "linear-gradient(135deg, #020b18 0%, #003a6b 100%)",
  Science: "linear-gradient(135deg, #020f0a 0%, #003a1a 100%)",
  Global: "linear-gradient(135deg, #0a0818 0%, #2d1b69 100%)",
  "Global Affairs": "linear-gradient(135deg, #0a0818 0%, #2d1b69 100%)",
};

export function getVideoGradient(category?: string | null) {
  return VIDEO_CATEGORY_GRADIENTS[category || ""] || VIDEO_CATEGORY_GRADIENTS.Global;
}

export function cleanNarrationText(text?: string | null) {
  return (text || "")
    .replace(/\*\*[A-Z\s]+\*\*/g, "")
    .replace(/#{1,3}\s+\w+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 5000);
}

export function estimateNarrationSeconds(text?: string | null) {
  const words = cleanNarrationText(text).split(/\s+/).filter(Boolean).length;
  return Math.max(18, Math.ceil((words / 145) * 60));
}

export function makeFallbackThumbnail(title?: string | null, category?: string | null) {
  const safeTitle = (title || "GAINN Live Report").replace(/[<>&]/g, "").slice(0, 90);
  const safeCategory = (category || "LIVE NEWS").replace(/[<>&]/g, "").toUpperCase().slice(0, 28);
  const accent = category === "Economy" ? "#10b981" : category === "Politics" ? "#ef4444" : category === "Technology" ? "#0ea5e9" : "#06b6d4";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#060910"/><stop offset="1" stop-color="#111827"/></linearGradient></defs>
    <rect width="1280" height="720" fill="url(#g)"/>
    <circle cx="1090" cy="120" r="180" fill="${accent}" opacity="0.22"/>
    <path d="M0 520 C260 430 430 600 700 500 S1040 410 1280 500 V720 H0Z" fill="${accent}" opacity="0.16"/>
    <rect x="74" y="70" width="190" height="44" rx="22" fill="#ef4444"/>
    <text x="100" y="99" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">GAINN LIVE</text>
    <text x="80" y="172" fill="${accent}" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4">${safeCategory}</text>
    <foreignObject x="78" y="230" width="850" height="260"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Georgia,serif;font-size:66px;line-height:1.05;color:white;font-weight:700;">${safeTitle}</div></foreignObject>
    <text x="82" y="640" fill="#94a3b8" font-family="Arial, sans-serif" font-size="26">Autonomous AI news briefing</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}