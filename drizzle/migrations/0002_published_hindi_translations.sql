CREATE TABLE public.published_text_translations (
 text_hash text NOT NULL,
 target text NOT NULL,
 translated_text text NOT NULL,
 source_content_hash text NOT NULL,
 source_url text NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (text_hash, target)
);
GRANT SELECT ON public.published_text_translations TO anon, authenticated;
GRANT ALL ON public.published_text_translations TO service_role;
ALTER TABLE public.published_text_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published translations" ON public.published_text_translations FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.news_translation_queue (
 content_hash text PRIMARY KEY,
 source_url text NOT NULL,
 texts jsonb NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
GRANT ALL ON public.news_translation_queue TO service_role;
ALTER TABLE public.news_translation_queue ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.news_translation_worker (
 id text PRIMARY KEY DEFAULT 'hindi',
 lease_until timestamptz NOT NULL DEFAULT '-infinity',
 lease_token uuid,
 paused_reason text,
 paused_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.news_translation_worker TO service_role;
GRANT SELECT ON public.news_translation_worker TO authenticated;
ALTER TABLE public.news_translation_worker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read translation worker status" ON public.news_translation_worker FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.acquire_news_translation_lease(token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.news_translation_worker (id) VALUES ('hindi') ON CONFLICT DO NOTHING;
 UPDATE public.news_translation_worker SET lease_until = now() + interval '5 minutes', lease_token = token, updated_at = now()
 WHERE id = 'hindi' AND lease_until < now() AND (paused_reason IS NULL OR paused_until <= now());
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.acquire_news_translation_lease(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_news_translation_lease(uuid) TO service_role;
CREATE INDEX news_translation_queue_pending_idx ON public.news_translation_queue (created_at DESC) WHERE status='pending';