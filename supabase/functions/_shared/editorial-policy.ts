export function publicHttps(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      url.hostname.includes('.') && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) && !url.hostname.endsWith('.local');
  } catch { return false; }
}

export function reviewProblem(input: {
  official_url: string; corroborating_url: string; image_url?: string | null;
  evidence_notes: string; script: string; facts_checked: boolean; image_rights_confirmed: boolean;
}): string | null {
  if (!publicHttps(input.official_url) || !publicHttps(input.corroborating_url)) return 'Two public HTTPS evidence links are required.';
  if (new URL(input.official_url).hostname === new URL(input.corroborating_url).hostname) return 'Corroboration must come from a different website.';
  if (!input.image_url || !publicHttps(input.image_url) || !input.image_rights_confirmed) return 'A story photo with confirmed usage permission is required.';
  if (!input.facts_checked) return 'Confirm that the facts have been checked.';
  if (input.evidence_notes.trim().length < 20 || input.script.trim().length < 40) return 'Add evidence notes and a complete narration script.';
  return null;
}