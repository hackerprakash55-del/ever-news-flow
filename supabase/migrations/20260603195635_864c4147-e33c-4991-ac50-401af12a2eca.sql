
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.match_claims(vector, float, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_claims(vector, float, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_topics(vector, float, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_topics(vector, float, int) TO service_role;
