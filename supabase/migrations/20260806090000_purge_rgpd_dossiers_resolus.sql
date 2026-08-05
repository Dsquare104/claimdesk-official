-- Purge RGPD : les dossiers résolus depuis plus de 3 ans n'ont plus de nécessité de
-- traitement (cf. commentaire "points d'extension" de src/lib/claims.functions.ts).
-- Déclenchement manuel (bouton manager sur /equipe), pas de tâche planifiée
-- automatique : la policy elle-même restreint la suppression aux seuls dossiers
-- éligibles, même en cas de bug côté application (défense en profondeur, comme le
-- reste des policies RLS de ce projet).
CREATE POLICY "managers purge old resolved claims" ON public.claims FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager')
    AND statut = 'resolu'
    AND date_resolution < now() - interval '3 years'
  );
