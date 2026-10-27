# GAINN Roadmap

## Current monitoring repairs
- [x] Repair and verify direct RSS and Google News RSS parsing (six tests, four live feeds in Deno, deployed feed returns RSS stories).
- [ ] Public Indian-language reading with protected generation — awaiting approval of the plan.

## Frontend & design research (done 2026-10-26)
- [x] Audit GAINN pages via screenshots; research 15 top news sites; report → /mnt/documents/GAINN_frontend_ux_research.md
- [x] P0 trust killers: removed fake metrics, "AI Verified" chip, public Generate buttons, fake views/lives, mock Breaking Now stories
- [x] P1 article page: lazy full-body expansion via expand-article fn, removed generic AI analysis + fake author stats, real <a> links, calm cached-feed notice
- [x] P2 presentation: Prime Time scrim + honest labels (no fake LIVE), Shorts max-2 chips + removed broken TRUST%, mobile breaking banner + floating button, Newsroom simulation disclaimer
- [x] P3 differentiators: captions (CC toggle) on Shorts + Prime Time, Prime Time transcript & per-story sources panel, named Video Library collections (World Tonight, Tech Briefing, Markets Wrap…)
- [x] Grievance Officer legal name: Prakash Chand Jain on /grievance

## Open / waiting on user
- [ ] Verify GitHub scheduled Shorts run shows green tick in Actions
- [ ] Legal: MIB registration + Grievance Officer appointment (user-only step)
- [ ] Payments collection (requested earlier, not implemented)
- [ ] Fresh security scan before broad sharing
- [ ] Publish to push all frontend fixes live

## Known technical constraints
- OpenRouter deepseek free unavailable → text gen falls back to Lovable AI
- News provider free tier limits Hindi live-feed refresh (cached stories)
- Mock stories appear only on localhost dev preview when the live feed is unreachable; never in production
