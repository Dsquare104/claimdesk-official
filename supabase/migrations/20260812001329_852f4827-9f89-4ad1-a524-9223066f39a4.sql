DROP POLICY "public claim submission" ON public.claims;
DROP POLICY "public claim tracking by email and secret code" ON public.claims;
REVOKE SELECT, INSERT ON public.claims FROM anon;

ALTER FUNCTION public.deposer_reclamation_publique(text, text, text, text, text, public.claim_type, text, date, date, boolean) SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.suivre_dossier_public(
  _code_suivi text,
  _client_email text
)
RETURNS TABLE (
  numero_dossier text,
  code_suivi text,
  statut public.claim_status,
  recevable boolean,
  motif_qualification text,
  remede text,
  produit text,
  type_reclamation public.claim_type,
  pays text,
  date_creation timestamptz,
  langue text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.numero_dossier, c.code_suivi, c.statut, c.recevable,
    c.motif_qualification, c.remede, c.produit, c.type_reclamation,
    c.pays, c.date_creation, c.langue
  FROM public.claims c
  WHERE length(trim(_code_suivi)) >= 12
    AND length(trim(_client_email)) >= 5
    AND c.code_suivi = upper(trim(_code_suivi))
    AND c.client_email = lower(trim(_client_email))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.deposer_reclamation_publique(text, text, text, text, text, public.claim_type, text, date, date, boolean) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.suivre_dossier_public(text, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.deposer_reclamation_publique(text, text, text, text, text, public.claim_type, text, date, date, boolean) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.suivre_dossier_public(text, text) TO anon, service_role;