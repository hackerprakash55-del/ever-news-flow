-- 1. Create tracking table for published shorts (Source of Truth)
-- Links to verification_runs which links to news_feed_cache articles
CREATE TABLE IF NOT EXISTS published_shorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL, -- Matches 'id' in news_feed_cache / verification_runs
  article_url TEXT,
  youtube_video_id TEXT,
  youtube_video_url TEXT,
  verification_run_id UUID REFERENCES verification_runs(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'skipped'
  error_message TEXT,
  UNIQUE(article_id) -- Prevents duplicate uploads of same story
);

-- 2. Create logs table for automation runs
CREATE TABLE IF NOT EXISTS auto_publish_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stories_checked INT,
  stories_published INT,
  stories_failed INT,
  dry_run BOOLEAN DEFAULT FALSE,
  error_message TEXT
);

-- 3. Create app_settings if not exists (Kill Switch & Config)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default settings (Safe defaults: Enabled, Cap 5, Dry Run ON)
INSERT INTO app_settings (key, value) 
VALUES 
  ('auto_publish_enabled', 'true'),
  ('daily_publish_cap', '5'),
  ('dry_run_mode', 'true') 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_published_shorts_article_id ON published_shorts(article_id);
CREATE INDEX IF NOT EXISTS idx_published_shorts_published_at ON published_shorts(published_at);
CREATE INDEX IF NOT EXISTS idx_auto_publish_logs_run_timestamp ON auto_publish_logs(run_timestamp);

COMMENT ON TABLE published_shorts IS 'Tracks all YouTube Shorts published from verified articles';
COMMENT ON TABLE auto_publish_logs IS 'Logs every automated publish run with counts and errors';
