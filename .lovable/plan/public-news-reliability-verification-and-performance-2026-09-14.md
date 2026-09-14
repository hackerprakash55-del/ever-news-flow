# Public News Reliability, Verification, and Performance

## Diagnosis

- The published public endpoint is reachable anonymously and the production client settings are present.
- The upstream news provider is currently returning its daily-limit error.
- The backend cache exists only in one running function instance, while the browser cache exists only in the visitor’s own browser. That explains why the editor can show previously saved stories but a fresh signed-out browser receives no live stories.
- Live articles currently receive a random credibility percentage and a single outlet name. Several screens then label them “Verified” even though no three-source verification record exists.

## Build

1. **Persist the public news feed**
   - Add a read-only public cached-news table with explicit grants and row-level policies.
   - Save every successful provider response there from the news function.
   - On provider timeout, error, or rate limit, serve the latest matching persisted feed to every visitor, independent of browser, account, or function instance.
   - Keep the endpoint publicly readable without a user session and return clear `cached`/`stale` metadata.
   - Show a visible “Live feed unavailable, showing latest cached stories” notice instead of silently substituting mock stories.
   - Stop treating mock stories as live runtime data; reserve them only as an explicit last-resort demo state with a visible label.

2. **Use source-backed verification data**
   - Extend the article model with the requested verification object and make the old score optional.
   - Map each provider story to its real outlet, source URL, and publication time. A normal provider result starts as `single-source` with no percentage.
   - Never default or randomize credibility or bias values.
   - Only show `verified` and a percentage when at least three distinct source records exist and the score includes its basis.
   - Replace static Left/Right/International and optimistic/critical template text with real disagreements and omissions only when those arrays contain source-backed data.

3. **Add the article verification section**
   - Add “Sources checked,” “What’s agreed,” optional “Where sources differ,” and optional “What’s missing elsewhere” below the existing article body.
   - Keep the article layout and all current reading features intact.
   - Initially show the full block for Business/Economy stories; other categories receive only the honest compact status until equivalent data exists.
   - Update cards, search, Shorts, Prime Time, banners, sharing text, and the article sidebar so none claims verification without three sources.

4. **Improve homepage load and scrolling without redesigning it**
   - Defer the Shorts strip, Must Read cards, video section, and trending sidebar until near the viewport, preserving their current space and layout.
   - Reuse the homepage’s one news result instead of starting duplicate feed/localization work in child sections.
   - Memoize ticker content so its CSS motion does not rebuild the whole list unnecessarily.
   - Keep the lead image prioritized; lazy-load below-fold images with fixed dimensions, async decoding, responsive size hints, and smaller variants where the image host supports them.
   - Remove the current invalid ref warning in the video cards while touching that deferred section.

## Verification

- Test the anonymous news endpoint after clearing browser storage and confirm it returns persisted stories during the provider’s current rate limit.
- Test the published site in a fresh signed-out browser context and confirm stories appear with the visible cached-feed notice.
- Confirm one-source stories show “Single source” or “Developing,” no percentage, no checkmark, and no invented disagreements.
- Confirm a three-source fixture renders its score and basis together.
- Check desktop and mobile homepage scrolling, below-fold activation, ticker stability, image loading, console output, and the final production build.

## External limitation

This fix makes saved live stories consistently available to everyone. It cannot create new upstream stories after the provider’s paid daily quota is exhausted; continuous fresh updates still require upgrading that provider account.
