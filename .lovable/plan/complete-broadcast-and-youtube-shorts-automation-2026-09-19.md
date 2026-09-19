# Complete broadcast and YouTube Shorts automation

## Goal
Finish the parts that can run automatically, remove dead-end publishing code, and clearly surface the one-time YouTube authorization needed from the channel owner.

## Changes
- Schedule the broadcast orchestrator and Shorts publisher securely with the existing cron secret.
- Align the review queue and verification queries with the actual database schema and require real admin authorization.
- Replace the broken YouTube API-key upload workflow with OAuth refresh-token publishing.
- Add a secure server-side YouTube connection flow so access tokens are refreshed without a browser-held token.
- Make the automated pipeline select eligible verified videos, render a vertical Short, upload it, and record success or failure.
- Keep daily limits, kill switch, retries, and honest source labels.
- Update the review page to show connection and publishing status rather than relying on a temporary browser token.

## Verification
- Confirm the frontend builds.
- Test unauthorized access rejection.
- Test broadcast scheduling and a dry-run publishing cycle.
- Verify database status/log updates.
- If YouTube has not granted a refresh token yet, leave publishing safely paused and provide the one required Connect action.

## Technical notes
The existing browser-only YouTube token expires after about one hour and cannot support unattended uploads. The replacement uses authorization-code OAuth, stores the renewable credential server-side, and keeps upload access off the browser.
