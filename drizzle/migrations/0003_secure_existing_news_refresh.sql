ALTER TABLE public.news_translation_worker ADD COLUMN refresh_secret text;
REVOKE SELECT ON public.news_translation_worker FROM authenticated;
GRANT SELECT (id, lease_until, paused_reason, paused_until, updated_at) ON public.news_translation_worker TO authenticated;
CREATE FUNCTION public.configure_trusted_news_refresh(endpoint text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_job bigint;
BEGIN
 IF endpoint !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/fetch-news$' THEN RAISE EXCEPTION 'Invalid news endpoint'; END IF;
 SELECT jobid INTO target_job FROM cron.job WHERE jobname='gainn-refresh-india-news';
 IF target_job IS NOT NULL THEN
 PERFORM cron.alter_job(target_job, command := format('SELECT net.http_get(url := %L, headers := (SELECT jsonb_build_object(''Content-Type'',''application/json'',''x-news-refresh-secret'',refresh_secret) FROM public.news_translation_worker WHERE id=''hindi''))', endpoint || '?category=all&pageSize=20&location=India&expand=false'));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.configure_trusted_news_refresh(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_trusted_news_refresh(text) TO service_role;