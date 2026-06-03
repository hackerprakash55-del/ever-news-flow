# GAINN Backend Upgrade — Universal AI News Agency

**Constraint:** Frontend stays exactly as-is. All work is in `supabase/` (migrations + edge functions) and new shared backend libs. Existing endpoints (`fetch-news`, `generate-video-script`, `elevenlabs-tts`) keep their response shapes so the UI continues to work — they become thin wrappers over the new pipeline.

This is large. I propose shipping it in **5 phases**, each independently deployable and testable. You can stop after any phase.

---

## Phase 1 — Memory & Trust Foundation (MERMAID-inspired)

**New tables (migration):**
- `sources` — domain, reliability_score, historical_accuracy, citation_quality, consistency_score, last_seen_at
- `claims` — normalized claim text, embedding (vector 1536), first_seen_at, status (verified/disputed/false/unknown), confidence
- `claim_evidence` — claim_id, source_id, stance (supports/refutes/neutral), excerpt, url, retrieved_at
- `agent_traces` — run_id, agent_name, input, output, reasoning, tokens, latency_ms, created_at
- `topic_memory` — topic, embedding, summary, entities (jsonb), last_updated
- `verification_runs` — story_id, consensus_score, agent_votes (jsonb), threshold_met, published

All admin-only RLS (service_role write, authenticated read via has_role('admin')). Enable `pgvector`.

**New edge function:** `memory-service` — RPC-style: `upsertClaim`, `findSimilarClaims`, `recordTrace`, `getSourceScore`, `updateSourceScore`.

---

## Phase 2 — Multi-Agent Newsroom Orchestrator

**New edge function:** `newsroom-orchestrate` — runs the full pipeline for one topic/story.

Pipeline (all using Lovable AI Gateway, `google/gemini-3-flash-preview` for fast agents, `google/gemini-2.5-pro` for reasoning/editorial):

```
Discovery → Verification → Contradiction → Reasoning → Consensus → Editorial → Distribution
```

Each agent is a pure function in `supabase/functions/_shared/agents/`:
- `discoveryAgent.ts` — pulls NewsAPI + RSS, dedupes via embedding similarity against `topic_memory`
- `verificationAgent.ts` — extracts atomic claims, retrieves evidence via multi-source search, scores
- `contradictionAgent.ts` — actively searches for refuting evidence (Debate-to-Detect style)
- `reasoningAgent.ts` — synthesizes evidence, weighs by source trust score
- `consensusEngine.ts` — runs N=3 reasoning passes, computes agreement, gates publishing at threshold (default 0.7)
- `editorialAgent.ts` — produces headline + 4-6 paragraph body + "Why it matters" + "What's next"
- `distributionAgent.ts` — fans out to article, short summary, social, video-script, podcast-script formats

Every step writes to `agent_traces`. Story only published if `consensus_score >= threshold`.

---

## Phase 3 — Retrieval-Augmented Verification + Search Intelligence

**New edge function:** `intel-search` — superior to keyword search.
- Embedding-based semantic search over `claims` + cached articles
- Entity extraction (people, orgs, countries) via Gemini, stored in `entities` table
- Event clustering: group claims by embedding cosine distance + temporal window
- Knowledge graph edges in `entity_relations` (subject, predicate, object, confidence, source_claim_id)
- Endpoints: `/search`, `/entity/:id`, `/event/:id`, `/trending`, `/breaking`

**Refactor `fetch-news`** to call `intel-search` first (cache hit) before falling back to NewsAPI. Cuts cost & latency.

---

## Phase 4 — Content Intelligence + Video Pipeline Upgrade

**Refactor `generate-video-script`** to use the new pipeline:
- Pulls verified claims from memory (not raw NewsAPI)
- Adds multi-perspective section (left/right/intl) from `claim_evidence` stances
- Emits separate scripts for: long-form, shorts, social-post, newsletter-blurb
- Stored in `generated_content` (new table) keyed by `story_id` + `format`

**New edge function:** `content-distribute` — given a story_id, produces all formats in one call.

**Live broadcast scaffolding:** new `broadcast-orchestrate` function + `live_broadcasts` / `broadcast_segments` tables. Cron job every 2 min checks for new high-confidence stories and appends segments to the active broadcast.

---

## Phase 5 — Admin Research Dashboard + Personalization

**New edge function:** `admin-metrics` (requires admin role):
- Agent agreement rate (last 24h/7d)
- Verification accuracy (against human-flagged ground truth table `verification_labels`)
- Source reliability trends
- Token spend per story, p50/p95 latency
- Memory hit-rate (cache reuse %)

**Personalization:**
- Extend `news_preferences` with `interest_embedding` (vector), `regional_weights` (jsonb)
- New function `personalize-feed` — ranks articles by cosine(user_interest, article_embedding) with diversity penalty (MMR) to avoid echo chambers
- Frontend already calls `useNews` — wrap it server-side, no FE change needed

---

## Technical Details

**Shared module layout:**
```
supabase/functions/_shared/
  ai.ts              // Lovable AI gateway client + retry/backoff
  embeddings.ts      // gemini-embedding-001 wrapper
  memory.ts          // typed access to memory tables
  agents/
    discovery.ts
    verification.ts
    contradiction.ts
    reasoning.ts
    consensus.ts
    editorial.ts
    distribution.ts
  trust.ts           // source scoring math
  search.ts          // semantic + entity helpers
```

**Models:**
- Fast/cheap agents: `google/gemini-3-flash-preview`
- Reasoning/editorial: `google/gemini-2.5-pro`
- Embeddings: `google/gemini-embedding-001` (1536 dims via `dimensions: 1536` to keep vector cols small)

**Cost controls:**
- Memory cache check before every LLM call
- Claim dedupe via embedding similarity (>0.92 → reuse)
- Background cron (`pg_cron`) regenerates trending topics every 10 min instead of per-request

**Backward compatibility:**
- `fetch-news` keeps same response shape; internally queries `claims` + falls back to NewsAPI
- `generate-video-script` keeps same response shape; internally calls new pipeline
- No frontend file is edited

**Migration plan:**
1. Ship Phase 1 migration + memory-service (zero FE impact)
2. Backfill `sources` from current NewsAPI domains seen in last 7 days
3. Ship Phase 2; route 10% of `fetch-news` traffic through orchestrator behind a flag, compare quality
4. Flip to 100% once consensus_score distribution looks healthy
5. Phases 3-5 incremental

---

## What I need from you

1. **Confirm phase order** or tell me to start with a different slice (e.g. "do Phase 1 + 5 first").
2. **Confidence threshold** for publishing: I propose 0.7 — OK?
3. **Admin role:** there is no roles table today. OK if Phase 1 also adds `user_roles` + `has_role()` (standard pattern) so admin endpoints are protected from day one?
4. **Want me to start Phase 1 now**, or review/adjust the plan first?