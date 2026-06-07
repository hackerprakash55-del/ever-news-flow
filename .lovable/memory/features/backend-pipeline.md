---
name: Backend agent pipeline (Phases 2–5)
description: Multi-agent newsroom routing, knowledge graph, live broadcast, MMR personalization, and ground-truth labels
type: feature
---
## Routing flag
- `app_settings.newsroom_pipeline = { enabled, rollout_pct }` — flip to send fetch-news through `newsroom-orchestrate`.
- Every decision is logged to `pipeline_decisions` (admin-readable).
- On orchestrator failure/timeout (>12s), fetch-news transparently falls back to NewsAPI.

## Knowledge graph
- Tables: `entities`, `entity_mentions`, `entity_edges`, `event_clusters` (all with pgvector embeddings in the `extensions` schema).
- `graphAgent` (shared/graph.ts) runs after consensus passes and extracts entities, dedupes them via `match_entities` (≥0.82), records relations, and clusters claims into `event_clusters` via `match_events` (≥0.75) with EMA hotness.
- Query via `intel-search?action=entity|events|graph`.

## Live broadcast
- `live_broadcasts` + `broadcast_segments`. Continuous stream model.
- `broadcast-orchestrate` runs every 2 min via pg_cron and appends intro/story/outro segments for the hottest unbroadcast event cluster (≥30 min cooldown).
- `generate-video-script` now also returns `shortScript`, `socialCaption`, `newsletterMd` and links to `event_cluster_id` + `claim_ids`.

## Personalization
- `personalize-feed` (JWT required). Computes per-user `interest_embedding` via EWMA (α=0.1) from `user_events`, then re-ranks recent published runs + hot clusters with MMR (default λ=0.7) using category + semantic diversity penalty.
- Client tracks engagement by inserting into `user_events`.

## Ground-truth labels
- `label-claim` (admin only) inserts into `ground_truth_labels`, updates `claims.status/confidence`, and blends `sources.reliability_score` + `historical_accuracy` for every evidence-linked source.
- `admin-metrics` exposes `accuracy_7d`, `accuracy_24h`, `pipeline_routing`, and `hot_events`.