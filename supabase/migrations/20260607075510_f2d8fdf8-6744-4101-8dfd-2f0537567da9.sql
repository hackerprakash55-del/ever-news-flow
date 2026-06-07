
-- Move pgvector out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Revoke EXECUTE on SECURITY DEFINER functions that shouldn't be user-callable
REVOKE EXECUTE ON FUNCTION public.match_claims(extensions.vector, double precision, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_topics(extensions.vector, double precision, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Ensure service_role can still call retrieval RPCs from edge functions
GRANT EXECUTE ON FUNCTION public.match_claims(extensions.vector, double precision, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_topics(extensions.vector, double precision, integer) TO service_role;
