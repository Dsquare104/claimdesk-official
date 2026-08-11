REVOKE ALL ON FUNCTION public.generer_code_suivi() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generer_code_suivi() TO service_role;