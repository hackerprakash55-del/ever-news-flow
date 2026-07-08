CREATE TABLE public.twitter_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL,
  tweet_id TEXT,
  tweet_text TEXT NOT NULL,
  headline TEXT NOT NULL,
  source_name TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  category TEXT NOT NULL,
  article_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.twitter_posts TO authenticated;
GRANT ALL ON public.twitter_posts TO service_role;

ALTER TABLE public.twitter_posts ENABLE ROW LEVEL SECURITY;

-- Admins can read the tweet history via the dashboard
CREATE POLICY "Admins can read twitter posts"
  ON public.twitter_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_twitter_posts_article ON public.twitter_posts(article_id);
CREATE INDEX idx_twitter_posts_created ON public.twitter_posts(created_at DESC);