-- Create auto_publish_logs table for tracking all automated publish attempts
CREATE TABLE IF NOT EXISTS auto_publish_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID,
  verification_basis TEXT,
  publish_status TEXT CHECK (publish_status IN ('triggered', 'success', 'failed', 'dry_run_skipped')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster daily cap queries
CREATE INDEX IF NOT EXISTS idx_auto_publish_logs_date_status 
ON auto_publish_logs(created_at, publish_status);

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default kill switch setting (enabled by default)
INSERT INTO app_settings (key, value) 
VALUES ('auto_publish_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add auto_publish_ready column to stories table if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'auto_publish_ready'
  ) THEN
    ALTER TABLE stories ADD COLUMN auto_publish_ready BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON TABLE auto_publish_logs IS 'Logs every automated YouTube publish attempt with status and errors';
COMMENT ON COLUMN auto_publish_logs.publish_status IS 'Status: triggered (webhook sent), success (uploaded), failed (error), dry_run_skipped (test mode)';
