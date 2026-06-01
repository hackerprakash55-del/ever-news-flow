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