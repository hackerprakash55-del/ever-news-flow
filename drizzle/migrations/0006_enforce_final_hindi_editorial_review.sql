CREATE OR REPLACE FUNCTION public.validate_short_candidate_review() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status = 'approved' THEN
  IF NEW.title !~ '[ऀ-ॿ]' OR NEW.script !~ '[ऀ-ॿ]' THEN RAISE EXCEPTION 'Review the final Hindi text before approval'; END IF;
  IF substring(NEW.official_url from '^https://([^/]+)') = substring(NEW.corroborating_url from '^https://([^/]+)') THEN RAISE EXCEPTION 'Independent corroboration requires another website'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_short_candidate_review BEFORE INSERT OR UPDATE ON public.short_candidates FOR EACH ROW EXECUTE FUNCTION public.validate_short_candidate_review();