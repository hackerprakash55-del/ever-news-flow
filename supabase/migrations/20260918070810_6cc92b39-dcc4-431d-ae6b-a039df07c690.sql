BEGIN;

REVOKE ALL ON TABLE public.app_settings FROM anon;
REVOKE ALL ON TABLE public.auto_publish_logs FROM anon;
REVOKE ALL ON TABLE public.published_shorts FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auto_publish_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.published_shorts TO authenticated;
GRANT ALL ON TABLE public.app_settings TO service_role;
GRANT ALL ON TABLE public.auto_publish_logs TO service_role;
GRANT ALL ON TABLE public.published_shorts TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_shorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings public read" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings admin write" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage app_settings" ON public.app_settings;
CREATE POLICY "Admins can manage app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage auto_publish_logs" ON public.auto_publish_logs;
CREATE POLICY "Admins can manage auto_publish_logs"
ON public.auto_publish_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage published_shorts" ON public.published_shorts;
CREATE POLICY "Admins can manage published_shorts"
ON public.published_shorts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

COMMIT;