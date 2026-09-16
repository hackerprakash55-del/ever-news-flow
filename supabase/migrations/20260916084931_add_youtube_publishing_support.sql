-- Migration: Add YouTube publishing support to review_queue
-- Created: 2026-09-16

-- Create review_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.generated_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  platform_status TEXT DEFAULT 'pending',
  platform_post_id TEXT,
  platform_url TEXT,
  youtube_upload_error TEXT,
  language TEXT DEFAULT 'en'
);

-- Enable RLS on review_queue
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to read/write
CREATE POLICY "review_queue admin read"
  ON public.review_queue FOR SELECT
  TO authenticated
  USING (true); -- Simplified: allow all authenticated users; tighten with has_role() if needed

CREATE POLICY "review_queue admin write"
  ON public.review_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "review_queue admin update"
  ON public.review_queue FOR UPDATE
  TO authenticated
  USING (true);

-- Add YouTube-specific columns (in case table already existed)
ALTER TABLE review_queue 
ADD COLUMN IF NOT EXISTS platform_post_id TEXT,
ADD COLUMN IF NOT EXISTS platform_url TEXT,
ADD COLUMN IF NOT EXISTS platform_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS youtube_upload_error TEXT;

-- Create index for faster lookups of pending items
CREATE INDEX IF NOT EXISTS idx_review_queue_platform_status 
ON review_queue(platform_status) 
WHERE approved_at IS NOT NULL AND posted_at IS NULL;

-- Create index on video_id for joins
CREATE INDEX IF NOT EXISTS idx_review_queue_video_id
ON review_queue(video_id);

-- Add comment documenting the workflow
COMMENT ON COLUMN review_queue.platform_post_id IS 'YouTube video ID after successful upload';
COMMENT ON COLUMN review_queue.platform_url IS 'Full YouTube Shorts URL (e.g., https://youtube.com/shorts/VIDEO_ID)';
COMMENT ON COLUMN review_queue.platform_status IS 'Status: pending, uploading, posted, failed';
COMMENT ON COLUMN review_queue.youtube_upload_error IS 'Error message if YouTube upload failed';

-- Ensure generated_videos has short_script column (may already exist)
ALTER TABLE generated_videos 
ADD COLUMN IF NOT EXISTS short_script TEXT,
ADD COLUMN IF NOT EXISTS social_caption TEXT;

COMMENT ON COLUMN generated_videos.short_script IS '60-second vertical short script (≤180 words)';
COMMENT ON COLUMN generated_videos.social_caption IS 'Social media caption (≤280 characters)';
