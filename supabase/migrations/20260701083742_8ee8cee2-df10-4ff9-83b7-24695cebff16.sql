DROP POLICY IF EXISTS "broadcast_segments public read" ON public.broadcast_segments;
CREATE POLICY "broadcast_segments live read"
  ON public.broadcast_segments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.live_broadcasts lb
      WHERE lb.id = broadcast_segments.broadcast_id
        AND lb.status IN ('live','completed')
    )
  );
CREATE POLICY "broadcast_segments admin read"
  ON public.broadcast_segments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));