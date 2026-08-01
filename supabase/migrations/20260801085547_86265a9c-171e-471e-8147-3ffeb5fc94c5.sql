DROP POLICY IF EXISTS "entity_mentions auth read" ON public.entity_mentions;

CREATE POLICY "Entity mentions for verified claims readable"
ON public.entity_mentions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = entity_mentions.claim_id
      AND c.status = ANY (ARRAY['verified'::text, 'disputed'::text])
  )
);

CREATE POLICY "Admins can read all entity mentions"
ON public.entity_mentions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));