# Backend Phases 2 – 5

Frontend is untouched. All work lives in `supabase/migrations/`, `supabase/functions/`, and `supabase/config.toml`. Existing response shapes for `fetch-news` and `generate-video-script` are preserved so the UI keeps working.

---

## Phase 2 — Route `fetch-news` through `newsroom-orchestrate` (behind a flag)

**Goal:** when the flag is on, every news fetch flows through the multi-agent pipeline (Discovery → Verification → Contradiction → Reasoning → Consensus → Editorial), persists verified claims, and only published runs reach the UI. When off, current behavior is kept.

- Add `app_settings` table (`key text primary key, value jsonb, updated_at`) seeded with `{ "key": "newsroom_pipeline", "value": { "enabled": false, "rollout_pct": 0 } }`. Public read, admin write.
- Edit `supabase/functions/fetch-news/index.ts`:
  - Read flag at start. If `enabled` and `Math.random()*100 < rollout_pct`, call the internal `orchestrate(category, region)` from shared agents.
  - Map orchestrator output → same article shape the UI expects (headline, summary, image, category, source, etc.). Tag with `verification: { consensus, claim_ids, run_id }` for downstream UI badges (read-only addition).
  - On orchestrator error or timeout (>15s), fall back to current NewsAPI path. Always succeeds.
- Add `pipeline_decisions` log (route, latency, fallback_reason) for the admin dashboard.

## Phase 3 — Knowledge graph + event clustering

**Goal:** turn isolated claims into entities, relations, and clustered events.

- New tables:
  - `entities (id, name, type[person|org|country|event|topic], aliases[], salience, embedding vector(1536), metadata, timestamps)` — unique on `lower(name)+type`.
  - `entity_mentions (id, entity_id, claim_id, span, confidence)`.
  - `entity_edges (id, src_entity, dst_entity, relation text, weight, evidence_claim_ids[], last_seen)` — unique `(src,dst,relation)`.
  - `event_clusters (id, label, summary, entity_ids[], claim_ids[], hotness, started_at, last_updated, embedding)`.
- New RPCs: `match_entities(embedding, threshold, count)`, `match_events(embedding, threshold, count)`. Service-role only.
- Extend `supabase/functions/_shared/agents.ts` with a `graphAgent` that, given a verified claim:
  1. extracts entities via Gemini Flash structured output,
  2. resolves each (semantic dedupe via `match_entities` ≥ 0.82),
  3. upserts `entities` + `entity_mentions`,
  4. emits relation triples (subject, predicate, object) and upserts `entity_edges`,
  5. assigns the claim to an `event_cluster` (similarity ≥ 0.75 with existing cluster centroid, else create new). Updates hotness with EMA on mention count.
- Wire `graphAgent` into the orchestrator after consensus passes.
- Extend `intel-search`:
  - `?action=entity&name=…` → entity card + top related entities + recent claims.
  - `?action=events&limit=` → ranked hot events.
  - `?action=graph&entity=` → 1-hop neighborhood (`{nodes, edges}`).

## Phase 4 — Video pipeline rewrite + live broadcast cron

**Goal:** scripts driven by verified claims, multi-format outputs, and a continuous AI broadcast.

- Rewrite `supabase/functions/generate-video-script/index.ts`:
  - Input: optional `event_cluster_id` or `topic`. Pulls top verified claims + entities + perspectives from the new tables.
  - Generates a single structured payload with sections: `long_form` (6–8 min), `short` (60 s vertical), `social` (≤280 char hook), `newsletter` (markdown). Same outer response field names kept for backwards compatibility (`title`, `script`, `duration`, `category`, `thumbnail_prompt`); new fields are additive.
  - Stores in `generated_videos` with new nullable columns: `event_cluster_id`, `short_script`, `social_caption`, `newsletter_md`, `claim_ids[]`.
- New tables for live broadcast:
  - `live_broadcasts (id, status[queued|live|ended], started_at, ended_at, headline, current_segment_id, metadata)`.
  - `broadcast_segments (id, broadcast_id, order, kind[headline|story|analysis|break], script, duration_s, voice, event_cluster_id, played_at)`.
- New edge function `broadcast-orchestrate`:
  - Picks the hottest non-broadcast event cluster, generates a 3-segment block (intro + story + outro), enqueues segments, advances `current_segment_id`.
  - Idempotent per broadcast (uses Postgres advisory lock keyed by broadcast id).
- Add cron via `supabase--insert` (not migration): pg_cron + pg_net hitting `broadcast-orchestrate` every 2 min with the project anon key.

## Phase 5 — MMR personalization + admin ground-truth labels

**Goal:** personalized, diverse feed and a labeling loop for accuracy tracking.

- Extend `news_preferences` with `interest_embedding vector(1536)` and `regional_weights jsonb default '{}'`.
- New tables:
  - `user_events (id, user_id, event_type[view|read|skip|bookmark|share|dwell], article_id, ts, dwell_ms)` — user-scoped RLS, insert by owner.
  - `ground_truth_labels (id, claim_id, label[true|false|misleading|unverifiable], rationale, labeled_by, created_at)` — admin-only write, admin read.
- New edge function `personalize-feed`:
  - Auth-required. Builds candidate set from latest published `verification_runs` + hot `event_clusters` (limit 200).
  - Re-ranks with **MMR**: `score = λ·sim(user, item) − (1−λ)·max sim(item, selected)`. λ defaults 0.7; diversity penalty on event_cluster overlap and category.
  - Incrementally updates `interest_embedding` from `user_events` (EWMA with α=0.1).
  - Returns ordered article list with `reason` per item.
- New edge function `label-claim` (admin only): writes a `ground_truth_labels` row, updates `claims.status` if confidence high, recomputes `sources.historical_accuracy` for that domain via SQL.
- Extend `admin-metrics`:
  - `accuracy_24h`, `accuracy_7d` from ground truth vs published claims.
  - `mmr_diversity_index` (avg pairwise dissimilarity of served feeds).
  - `pipeline_routing` (% through orchestrator vs fallback).

---

## Cross-cutting

- Every new public-schema table ships with `GRANT`s in the same migration (service_role always; authenticated/anon only when policy allows).
- All new SECURITY DEFINER functions: `REVOKE EXECUTE FROM anon, authenticated` + explicit `GRANT EXECUTE TO service_role`.
- pgvector stays in `extensions` schema (already moved).
- New edge functions added to `supabase/config.toml`:
  - `broadcast-orchestrate`, `personalize-feed` → `verify_jwt = true`.
  - `label-claim` → `verify_jwt = true`.

## Execution order

1. Phase 2 migration + `fetch-news` edit + flag table.
2. Phase 3 migration + `graphAgent` + `intel-search` extensions + orchestrator wiring.
3. Phase 4 migration + `generate-video-script` rewrite + `broadcast-orchestrate` + cron.
4. Phase 5 migration + `personalize-feed` + `label-claim` + `admin-metrics` extensions.

After each phase: lint + redeploy affected functions. No frontend changes anywhere.
