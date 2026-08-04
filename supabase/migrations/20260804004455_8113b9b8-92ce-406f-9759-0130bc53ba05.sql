CREATE TYPE public.app_role AS ENUM ('client','agent','manager');
CREATE TYPE public.claim_type AS ENUM ('retractation','non_conformite','livraison','facturation');
CREATE TYPE public.claim_status AS ENUM ('cree','qualifie','rejete','instruction','resolu','escalade');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text,
  consentement_rgpd boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE SEQUENCE public.claim_dossier_seq START 1042;

CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_dossier text NOT NULL UNIQUE DEFAULT ('CD-' || to_char(now(),'YYYY') || '-' || nextval('public.claim_dossier_seq')),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_nom text NOT NULL,
  pays text NOT NULL,
  produit text NOT NULL,
  type_reclamation public.claim_type NOT NULL,
  description text NOT NULL,
  date_achat date NOT NULL,
  date_livraison date,
  date_creation timestamptz NOT NULL DEFAULT now(),
  statut public.claim_status NOT NULL DEFAULT 'cree',
  recevable boolean,
  motif_qualification text,
  remede text,
  temps_traitement_jours integer,
  agent_assigne_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  commentaire_interne text,
  consentement_rgpd boolean NOT NULL DEFAULT false,
  date_resolution timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client reads own claims" ON public.claims FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "client creates own claims" ON public.claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "staff updates claims" ON public.claims FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'manager'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, consentement_rgpd)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nom', ''), COALESCE((NEW.raw_user_meta_data->>'consentement_rgpd')::boolean, false))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client'))
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();