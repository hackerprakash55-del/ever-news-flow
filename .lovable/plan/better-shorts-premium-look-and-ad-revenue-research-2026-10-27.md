# Better Shorts, premium look, and ad revenue research

## 1. YouTube Shorts that look like real news videos
Current problem (confirmed from your screenshot): black screen, plain text, and Hindi letters show as empty boxes because the rendering server is missing Hindi fonts.

Fixes to the automatic renderer (GitHub workflow + youtube-publisher function):
- Use each story's real photo (already available in the news feed) as a full-screen background with a slow zoom-in, so the video moves instead of sitting static.
- Dark gradient at the bottom so the white headline stays readable over any photo.
- Install proper Hindi (Devanagari) fonts so Hindi titles render correctly.
- Keep the GAINN branding: cyan top bar, GAINN logo text, source name, and site link.
- Add a small category tag (e.g. "Business", "Defence") above the headline.
- Fallback: if a story has no photo, keep a nicer animated gradient background instead of flat black.
- Test by rendering and uploading one real Short, then check it on your channel.

## 2. Make the site look premium, not AI-generated
Research-backed polish pass across the whole site:
- Calmer, more editorial design: fewer glowing badges and chips, cleaner spacing, consistent card styles (like BBC / The Hindu / Reuters, which look premium through restraint).
- Typography: stronger headline hierarchy, better line lengths for reading.
- Homepage: clearer sections with real photos leading, less visual noise.
- Article page: cleaner reading experience — bigger comfortable text, clear source and time, no clutter.
- Consistent colors and buttons everywhere (one accent, not many).
- Verified with screenshots on desktop and mobile sizes.

## 3. Ad revenue research (report, no changes yet)
Research and deliver a written report covering:
- Google AdSense: requirements, how approval works for a news site, what it pays for Indian traffic, and the risk with AI-assisted content.
- Alternatives that fit a small new site better: direct sponsorships from local businesses, affiliate links, and selling translation/Shorts services to regional publishers (already in your plan).
- What traffic level you realistically need before ads pay meaningful money.
- A recommended order: what to do now vs. later.
Saved to your Files as a report you can read anytime.

## Notes
- The Shorts fix goes live through the existing GitHub automation — no manual work needed after the first test upload.
- The site polish needs a publish at the end to go live.
