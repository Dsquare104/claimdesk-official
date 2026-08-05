-- Email consultable par les managers pour retrouver un utilisateur à promouvoir (agent/manager),
-- sans donner accès au schéma auth. Alimenté à la création du compte, non modifiable par le client.
ALTER TABLE public.profiles ADD COLUMN email text;
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

-- Ferme la faille de sécurité MVP : handle_new_user() attribuait le rôle transmis par le client
-- (raw_user_meta_data->>'role') à l'inscription, permettant à n'importe qui de s'auto-attribuer
-- agent ou manager. Le rôle par défaut est désormais toujours 'client', indépendamment de ce que
-- le client envoie. L'attribution des rôles agent/manager devient une action manager (cf. policies
-- ci-dessous et attribuerRole côté serveur).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, email, consentement_rgpd)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nom', ''), NEW.email, COALESCE((NEW.raw_user_meta_data->>'consentement_rgpd')::boolean, false))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Permet aux managers de gérer les rôles des autres utilisateurs (attribution agent/manager),
-- en plus de la lecture de son propre rôle déjà permise par "own roles read".
CREATE POLICY "managers manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- Permet aux managers de retrouver un profil par e-mail pour lui attribuer un rôle.
CREATE POLICY "managers read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));
