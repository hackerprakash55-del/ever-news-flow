# Restore public Indian-language reading safely

## Confirmed issue
Signed-out readers receive English text after selecting Hindi or another Indian language. The translation service intentionally requires sign-in after the earlier security repairs; the page silently treats the English fallback as a successful translation.

Removing that protection would reopen anonymous access to a paid service. This needs a bounded publishing approach, not a one-line authorization change.

## Proposed changes
- Let anyone read already-published translations without signing in.
- Start with a bounded batch of current India headlines and summaries in Hindi. Keep other supported languages visible, with an honest availability message when their translation is missing.
- Translate only published content through trusted automation; keep arbitrary on-demand text translation protected.
- Store published article-body translations when a source-supported body is available. Never create missing facts to fill a translation.
- Show whether the displayed text is translated, original, or unavailable. Offer sign-in for protected on-demand translation without blocking English reading.
- Keep current voice, video, and other security restrictions unchanged.

## Cost and freshness
Generate each published Hindi variant once and reuse it across readers, rather than paying per visitor. Begin with at most 20 current stories per batch and retain the existing five-minute news refresh; skip content already translated. Expanding automated publication to every language requires a separate agreed budget. Do not add another permanent polling job.

## Technical details
- Use stable source-based content identifiers and content hashes to reuse translations and invalidate changed source text.
- Add a published translation store with public read-only access and trusted writes; never expose private records or secrets.
- Public reads accept only published identifiers and supported language codes, not arbitrary translation text.
- Integrate bounded generation into the existing trusted news/publishing workflow with validation, concurrency limits, and deduplication.
- Preserve `requireUserOrService` for on-demand translation; distinguish denied, unavailable, and successfully translated responses in the client.

## Verification
- Test anonymous published-translation reads and refusal of anonymous paid generation.
- Test changed-content invalidation and batch bounds.
- Verify a signed-out visitor reads a real Hindi headline and article translation where published; missing translations show an honest fallback.
- Verify signed-in on-demand translation still works and English reading remains public.

## Already completed separately
Direct RSS and Google News parsing now use a server-compatible XML parser. Six tests pass; all four live feeds parsed successfully in Deno, and the deployed news response includes RSS stories.