
ALTER TABLE public.news_preferences
  ADD COLUMN IF NOT EXISTS interest_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS regional_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_signal_at timestamptz;

CREATE TABLE public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view','read','skip','bookmark','share','dwell')),
  article_id text NOT NULL,
  category text,
  dwell_ms int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_events_user_ts_idx ON public.user_events (user_id, ts DESC);
GRANT SELECT, INSERT ON public.user_events TO authenticated;
GRANT ALL ON public.user_events TO service_role;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_events owner read" ON public.user_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user_events owner insert" ON public.user_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ground_truth_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label IN ('true','false','misleading','unverifiable')),
  rationale text,
  labeled_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ground_truth_claim_idx ON public.ground_truth_labels (claim_id, created_at DESC);
GRANT SELECT ON public.ground_truth_labels TO authenticated;
GRANT ALL ON public.ground_truth_labels TO service_role;
ALTER TABLE public.ground_truth_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ground_truth admin read" ON public.ground_truth_labels FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ground_truth admin insert" ON public.ground_truth_labels FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND labeled_by = auth.uid());
