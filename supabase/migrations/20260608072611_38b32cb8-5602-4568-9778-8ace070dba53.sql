
-- Restrict generated_videos INSERT to admins
DROP POLICY IF EXISTS "Authenticated users can insert generated_videos" ON public.generated_videos;
CREATE POLICY "Admins can insert generated_videos"
ON public.generated_videos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict app_settings SELECT to admins
DROP POLICY IF EXISTS "app_settings public read" ON public.app_settings;
CREATE POLICY "Admins can read app_settings"
ON public.app_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restrict verification_runs SELECT to admins
DROP POLICY IF EXISTS "Verification runs readable by authenticated" ON public.verification_runs;
CREATE POLICY "Admins can read verification_runs"
ON public.verification_runs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restrict profiles SELECT to owner (or admin)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
