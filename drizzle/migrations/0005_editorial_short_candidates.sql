CREATE TABLE public.short_candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 article_id text NOT NULL UNIQUE,
 title text NOT NULL,
 script text NOT NULL,
 source_name text NOT NULL,
 source_url text NOT NULL,
 image_url text,
 official_url text NOT NULL,
 corroborating_url text NOT NULL,
 evidence_notes text NOT NULL,
 facts_checked boolean NOT NULL DEFAULT false,
 image_rights_confirmed boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 created_by uuid NOT NULL,
 reviewed_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
GRANT SELECT ON public.short_candidates TO authenticated;
GRANT ALL ON public.short_candidates TO service_role;
ALTER TABLE public.short_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read editorial candidates" ON public.short_candidates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.youtube_publish_queue ADD COLUMN candidate_id uuid REFERENCES public.short_candidates(id);
CREATE UNIQUE INDEX youtube_queue_candidate_unique ON public.youtube_publish_queue(candidate_id);
CREATE OR REPLACE FUNCTION public.approve_short_candidate(p_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.short_candidates; queue_id uuid;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 SELECT * INTO c FROM public.short_candidates WHERE id = p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
 IF c.status = 'approved' THEN
  SELECT id INTO queue_id FROM public.youtube_publish_queue WHERE candidate_id = c.id;
  RETURN queue_id;
 END IF;
 IF c.status <> 'pending' THEN RAISE EXCEPTION 'Only pending candidates can be approved'; END IF;
 IF NOT c.facts_checked OR NOT c.image_rights_confirmed OR c.image_url IS NULL OR length(trim(c.script)) < 40 OR length(trim(c.evidence_notes)) < 20 OR c.official_url NOT LIKE 'https://%' OR c.corroborating_url NOT LIKE 'https://%' OR c.official_url = c.corroborating_url THEN
  RAISE EXCEPTION 'Fact review, independent evidence, and image permission are required';
 END IF;
 INSERT INTO public.youtube_publish_queue(article_id,title,script,source_name,source_url,image_url,language,candidate_id)
 VALUES(c.article_id,c.title,c.script,c.source_name,c.source_url,c.image_url,'hi-IN',c.id) RETURNING id INTO queue_id;
 UPDATE public.short_candidates SET status='approved',reviewed_by=auth.uid(),reviewed_at=now() WHERE id=c.id;
 RETURN queue_id;
END $$;
REVOKE ALL ON FUNCTION public.approve_short_candidate(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_short_candidate(uuid) TO authenticated;