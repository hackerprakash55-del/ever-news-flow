-- 1. generated_videos: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert generated_videos" ON public.generated_videos;
CREATE POLICY "Authenticated users can insert generated_videos"
ON public.generated_videos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. storage.objects: drop broad listing policy on avatars
--    (public bucket still serves files via public URLs)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 4. Lock down SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;