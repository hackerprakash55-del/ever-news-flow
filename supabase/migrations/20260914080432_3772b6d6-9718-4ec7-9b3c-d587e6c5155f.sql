CREATE TABLE public.news_feed_cache (
  cache_key text PRIMARY KEY,
  category text NOT NULL,
  location text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  query_text text NOT NULL DEFAULT '',
  page_size integer NOT NULL DEFAULT 20,
  articles jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_results integer NOT NULL DEFAULT 0,
  provider text NOT NULL DEFAULT 'NewsAPI',
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_feed_cache TO anon, authenticated;
GRANT ALL ON public.news_feed_cache TO service_role;

ALTER TABLE public.news_feed_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cached news"
ON public.news_feed_cache
FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_news_feed_cache_updated_at
BEFORE UPDATE ON public.news_feed_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();