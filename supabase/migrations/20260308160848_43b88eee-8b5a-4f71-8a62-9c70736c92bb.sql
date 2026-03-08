
CREATE TABLE public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  duration TEXT DEFAULT '6-8 min',
  script TEXT NOT NULL,
  thumbnail_prompt TEXT DEFAULT '',
  raw_headlines JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read generated_videos"
  ON public.generated_videos FOR SELECT USING (true);

CREATE POLICY "Anyone can insert generated_videos"
  ON public.generated_videos FOR INSERT WITH CHECK (true);
