
ALTER TABLE public.generated_videos
  ADD COLUMN IF NOT EXISTS event_cluster_id uuid REFERENCES public.event_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS short_script text,
  ADD COLUMN IF NOT EXISTS social_caption text,
  ADD COLUMN IF NOT EXISTS newsletter_md text,
  ADD COLUMN IF NOT EXISTS claim_ids uuid[] NOT NULL DEFAULT '{}';

CREATE TABLE public.live_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','live','ended')),
  headline text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  current_segment_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX live_broadcasts_status_idx ON public.live_broadcasts (status, started_at DESC);
GRANT SELECT ON public.live_broadcasts TO anon, authenticated;
GRANT ALL ON public.live_broadcasts TO service_role;
ALTER TABLE public.live_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_broadcasts public read" ON public.live_broadcasts FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.broadcast_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.live_broadcasts(id) ON DELETE CASCADE,
  segment_order int NOT NULL,
  kind text NOT NULL CHECK (kind IN ('headline','story','analysis','break','intro','outro')),
  script text NOT NULL,
  duration_s int NOT NULL DEFAULT 30,
  voice text NOT NULL DEFAULT 'anchor',
  event_cluster_id uuid REFERENCES public.event_clusters(id) ON DELETE SET NULL,
  played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX broadcast_segments_order_idx ON public.broadcast_segments (broadcast_id, segment_order);
GRANT SELECT ON public.broadcast_segments TO anon, authenticated;
GRANT ALL ON public.broadcast_segments TO service_role;
ALTER TABLE public.broadcast_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcast_segments public read" ON public.broadcast_segments FOR SELECT TO anon, authenticated USING (true);
