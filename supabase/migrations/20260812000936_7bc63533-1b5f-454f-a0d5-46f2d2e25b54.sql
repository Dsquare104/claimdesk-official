CREATE OR REPLACE FUNCTION public.deposer_reclamation_publique(
  _client_nom text,
  _client_email text,
  _pays text,
  _langue text,
  _produit text,
  _type_reclamation public.claim_type,
  _description text,
  _date_achat date,
  _date_livraison date,
  _consentement_rgpd boolean
)
RETURNS TABLE (
  numero_dossier text,
  code_suivi text,
  statut public.claim_status,
  recevable boolean,
  motif_qualification text,
  remede text,
  client_nom text,
  type_reclamation public.claim_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _statut public.claim_status;
  _recevable boolean;
  _motif text;
  _remede text;
BEGIN
  IF NOT _consentement_rgpd THEN
    RAISE EXCEPTION 'Le consentement RGPD est obligatoire.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(_client_nom)) < 2 OR length(trim(_client_nom)) > 120 THEN
    RAISE EXCEPTION 'Nom invalide.' USING ERRCODE = '22023';
  END IF;
  IF _client_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' OR length(_client_email) > 255 THEN
    RAISE EXCEPTION 'Adresse e-mail invalide.' USING ERRCODE = '22023';
  END IF;
  IF _pays NOT IN ('France', 'Allemagne', 'Espagne', 'Italie', 'Belgique', 'Pays-Bas', 'Pologne') THEN
    RAISE EXCEPTION 'Pays invalide.' USING ERRCODE = '22023';
  END IF;
  IF _langue NOT IN ('fr', 'de', 'es', 'it', 'nl', 'pl') THEN
    RAISE EXCEPTION 'Langue invalide.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(_produit)) < 2 OR length(trim(_produit)) > 160 THEN
    RAISE EXCEPTION 'Produit invalide.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(_description)) < 10 OR length(trim(_description)) > 2000 THEN
    RAISE EXCEPTION 'Description invalide.' USING ERRCODE = '22023';
  END IF;
  IF _date_achat > current_date OR (_date_livraison IS NOT NULL AND _date_livraison > current_date) THEN
    RAISE EXCEPTION 'Une date ne peut pas être future.' USING ERRCODE = '22023';
  END IF;
  IF _date_livraison IS NOT NULL AND _date_livraison < _date_achat THEN
    RAISE EXCEPTION 'La livraison ne peut pas précéder l''achat.' USING ERRCODE = '22023';
  END IF;

  CASE _type_reclamation
    WHEN 'retractation' THEN
      IF _date_livraison IS NULL THEN
        _statut := 'rejete'; _recevable := false;
        _motif := 'Date de livraison requise pour calculer le délai de rétractation.';
        _remede := NULL;
      ELSIF current_date - _date_livraison <= 14 THEN
        _statut := 'qualifie'; _recevable := true;
        _motif := 'Rétractation exercée dans le délai légal de 14 jours calendaires.';
        _remede := 'Remboursement';
      ELSE
        _statut := 'rejete'; _recevable := false;
        _motif := 'Le délai légal de rétractation de 14 jours est dépassé.';
        _remede := NULL;
      END IF;
    WHEN 'non_conformite' THEN
      IF _date_achat >= (current_date - interval '24 months')::date THEN
        _statut := 'qualifie'; _recevable := true;
        IF _date_livraison IS NOT NULL AND _date_livraison >= (current_date - interval '12 months')::date THEN
          _motif := 'Garantie légale applicable ; le défaut est présumé antérieur à la livraison.';
        ELSE
          _motif := 'Garantie légale de conformité applicable pendant 24 mois.';
        END IF;
        _remede := 'Mise en conformité, remplacement ou remboursement selon instruction';
      ELSE
        _statut := 'rejete'; _recevable := false;
        _motif := 'Le délai de garantie légale de conformité de 24 mois est dépassé.';
        _remede := NULL;
      END IF;
    ELSE
      _statut := 'instruction'; _recevable := true;
      _motif := CASE _type_reclamation
        WHEN 'livraison' THEN 'Litige de livraison recevable et transmis pour instruction.'
        ELSE 'Erreur de facturation recevable et transmise pour instruction.'
      END;
      _remede := 'Instruction du dossier';
  END CASE;

  RETURN QUERY
  INSERT INTO public.claims (
    client_id, client_nom, client_email, pays, langue, produit,
    type_reclamation, description, date_achat, date_livraison,
    consentement_rgpd, statut, recevable, motif_qualification, remede
  ) VALUES (
    NULL, trim(_client_nom), lower(trim(_client_email)), _pays, _langue, trim(_produit),
    _type_reclamation, trim(_description), _date_achat, _date_livraison,
    true, _statut, _recevable, _motif, _remede
  )
  RETURNING claims.numero_dossier, claims.code_suivi, claims.statut,
    claims.recevable, claims.motif_qualification, claims.remede,
    claims.client_nom, claims.type_reclamation;
END;
$$;

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
  WHERE c.code_suivi = upper(trim(_code_suivi))
    AND c.client_email = lower(trim(_client_email))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.deposer_reclamation_publique(text, text, text, text, text, public.claim_type, text, date, date, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.suivre_dossier_public(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deposer_reclamation_publique(text, text, text, text, text, public.claim_type, text, date, date, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.suivre_dossier_public(text, text) TO anon, authenticated, service_role;