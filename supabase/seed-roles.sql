-- Script manuel, à coller dans l'éditeur SQL Lovable (Backend > SQL Editor).
-- N'est PAS une migration (pas dans supabase/migrations/) : à lancer une seule fois,
-- après avoir exécuté `bun run scripts/seed-demo-users.ts` (ou après toute inscription
-- via /auth dont on veut confirmer le compte et/ou changer le rôle par défaut).
--
-- 1) Confirme les comptes de démo (adresses factices @claimdesk.test : aucun lien de
--    confirmation ne sera jamais reçu par un vrai client mail).
update auth.users
set email_confirmed_at = now()
where email in (
  'client1.demo@claimdesk.test',
  'client2.demo@claimdesk.test',
  'agent.demo@claimdesk.test',
  'manager.demo@claimdesk.test'
)
and email_confirmed_at is null;

-- 2) Attribue les rôles agent/manager (tous les comptes sont créés en 'client' par
--    défaut depuis le correctif de la faille d'auto-attribution de rôle à l'inscription).
insert into public.user_roles (user_id, role)
select id, 'agent' from auth.users where email = 'agent.demo@claimdesk.test'
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select id, 'manager' from auth.users where email = 'manager.demo@claimdesk.test'
on conflict (user_id, role) do nothing;

-- À partir de là, manager.demo@claimdesk.test peut se connecter sur /auth et attribuer
-- d'autres rôles depuis le panneau "Attribution des rôles" sur /analytics — plus besoin
-- de SQL manuel pour les comptes suivants.
