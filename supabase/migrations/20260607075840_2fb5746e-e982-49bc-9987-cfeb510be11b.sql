
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings(key, value) VALUES
  ('newsroom_pipeline', '{"enabled": false, "rollout_pct": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.pipeline_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  route text NOT NULL,           -- 'orchestrator' | 'fallback'
  category text,
  region text,
  topic text,
  rollout_pct int,
  flag_enabled boolean,
  latency_ms int,
  fallback_reason text,
  run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pipeline_decisions TO authenticated;
GRANT ALL ON public.pipeline_decisions TO service_role;
ALTER TABLE public.pipeline_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_decisions admin read" ON public.pipeline_decisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX pipeline_decisions_created_idx ON public.pipeline_decisions (created_at DESC);
