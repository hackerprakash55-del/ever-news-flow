-- Tighten over-permissive read policies on internal news-intelligence tables.
-- These tables are only read by edge functions via service_role; the website
-- never queries them directly as anon/authenticated, so the USING (true)
-- public-read policies are replaced by default-deny RLS.

DROP POLICY IF EXISTS "Public can read cached news" ON public.news_feed_cache;
DROP POLICY IF EXISTS "Sources are publicly readable" ON public.sources;
DROP POLICY IF EXISTS "entity_edges public read" ON public.entity_edges;
DROP POLICY IF EXISTS "Evidence readable by authenticated users" ON public.claim_evidence;
DROP POLICY IF EXISTS "Topic memory readable by all" ON public.topic_memory;
DROP POLICY IF EXISTS "live_broadcasts public read" ON public.live_broadcasts;
DROP POLICY IF EXISTS "event_clusters public read" ON public.event_clusters;
DROP POLICY IF EXISTS "entities public read" ON public.entities;

-- Remove anon/authenticated table privileges (including TRUNCATE/MAINTAIN,
-- which RLS does not govern). service_role retains full access.
REVOKE ALL ON public.news_feed_cache FROM anon, authenticated;
REVOKE ALL ON public.sources FROM anon, authenticated;
REVOKE ALL ON public.entity_edges FROM anon, authenticated;
REVOKE ALL ON public.claim_evidence FROM anon, authenticated;
REVOKE ALL ON public.topic_memory FROM anon, authenticated;
REVOKE ALL ON public.live_broadcasts FROM anon, authenticated;
REVOKE ALL ON public.event_clusters FROM anon, authenticated;
REVOKE ALL ON public.entities FROM anon, authenticated;
