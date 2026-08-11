ALTER TABLE public.claims ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS code_suivi text,
  ADD COLUMN IF NOT EXISTS langue text NOT NULL DEFAULT 'fr';

CREATE OR REPLACE FUNCTION public.generer_code_suivi()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidat text;
  i int;
BEGIN
  LOOP
    candidat := 'SUIVI-';
    FOR i IN 1..8 LOOP
      candidat := candidat || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.claims WHERE code_suivi = candidat);
  END LOOP;
  RETURN candidat;
END;
$$;

UPDATE public.claims SET code_suivi = public.generer_code_suivi() WHERE code_suivi IS NULL;

ALTER TABLE public.claims
  ALTER COLUMN code_suivi SET DEFAULT public.generer_code_suivi(),
  ALTER COLUMN code_suivi SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS claims_code_suivi_key ON public.claims (code_suivi);
CREATE INDEX IF NOT EXISTS claims_client_email_idx ON public.claims (lower(client_email));