# GAINN Roadmap

## Frontend & design research (done 2026-10-26)
- [x] Audit GAINN pages via screenshots; research 15 top news sites; report → /mnt/documents/GAINN_frontend_ux_research.md
- [x] P0 trust killers: removed fake metrics, "AI Verified" chip, public Generate buttons, fake views/lives, mock Breaking Now stories
- [x] P1 article page: lazy full-body expansion via expand-article fn, removed generic AI analysis + fake author stats, real <a> links, calm cached-feed notice
- [x] P2 presentation: Prime Time scrim + honest labels (no fake LIVE), Shorts max-2 chips + removed broken TRUST%, mobile breaking banner + floating button, Newsroom simulation disclaimer

## Next up (P3 differentiators)
- [ ] Captions/transcripts on Shorts and Prime Time narration
- [ ] Per-segment source citations in Prime Time
- [ ] Named video collections in Video Library

## Open / waiting on user
- [ ] Grievance Officer full legal name (placeholder "Prakash, Founder, GAINN" on /grievance)
- [ ] Verify GitHub scheduled Shorts run shows green tick in Actions
- [ ] Legal: MIB registration + Grievance Officer appointment (user-only step)
- [ ] Payments collection (requested earlier, not implemented)
- [ ] Fresh security scan before broad sharing
- [ ] Publish to push all frontend fixes live

## Known technical constraints
- OpenRouter deepseek free unavailable → text gen falls back to Lovable AI
- News provider free tier limits Hindi live-feed refresh (cached stories)
