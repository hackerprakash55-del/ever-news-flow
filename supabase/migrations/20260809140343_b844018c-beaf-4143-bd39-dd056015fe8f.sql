ALTER TABLE public.twitter_posts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'article';
CREATE INDEX IF NOT EXISTS twitter_posts_kind_article_idx ON public.twitter_posts (kind, article_id);