import { describe, expect, it } from 'vitest';
import { publicHttps, reviewProblem } from '../../supabase/functions/_shared/editorial-policy';
const review = { official_url: 'https://pib.gov.in/release', corroborating_url: 'https://www.thehindu.com/news/story', image_url: 'https://pib.gov.in/photo.jpg', evidence_notes: 'The primary announcement and independent report agree.', script: 'A factual Hindi narration script with sufficient detail for editorial review.', facts_checked: true, image_rights_confirmed: true };
describe('editorial Shorts approval', () => {
  it('requires a fact check before publication', () => expect(reviewProblem({ ...review, facts_checked: false })).not.toBeNull());
  it('requires photo permission', () => expect(reviewProblem({ ...review, image_rights_confirmed: false })).not.toBeNull());
  it('requires independent corroboration', () => expect(reviewProblem({ ...review, corroborating_url: 'https://pib.gov.in/other' })).not.toBeNull());
  it('accepts reviewed source-backed content', () => expect(reviewProblem(review)).toBeNull());
  it('rejects private and non-HTTPS links', () => { expect(publicHttps('https://127.0.0.1/a')).toBe(false); expect(publicHttps('http://pib.gov.in')).toBe(false); });
});