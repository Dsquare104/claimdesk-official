# ClaimDesk — Document de cadrage du projet

Ce document sert de base de référence pour la réalisation du système de gestion des réclamations
ClaimDesk. Il synthétise le cahier des charges transmis (« Cahier des Charges & Lettre de Mission -
ClaimDesk.docx »), l'état réel du code existant, et le plan de réalisation retenu pour la suite.

## 1. Contexte métier

- **Commanditaire** : OMNIVIA, e-commerçant transfrontalier opérant dans 7 pays de l'UE (France,
  Allemagne, Espagne, Italie, Belgique, Pays-Bas, Pologne), conduite technique assurée par RINTIO.
- **Prestataire** : SecurCom Agency, 4 pôles d'expertise — CIB (droit/métier), RMS (cybersécurité/
  infra), MCM (UI/UX/communication), EGP (gestion de projet/analytics).
- **Besoin** : le service juridique et contentieux d'OMNIVIA fait face à une hausse des réclamations
  clients (non-conformité, litiges de livraison, erreurs de facturation, rétractation) sur 7
  réglementations nationales différentes. Il manque un outil unifié pour qualifier juridiquement,
  centraliser et piloter le cycle de vie de chaque dossier, ce qui cause retards de traitement,
  risques de non-conformité au droit de la consommation, et insatisfaction client.
- **Cycle de vie visé** : Création → Qualification → Instruction → Résolution / Escalade vers
  médiateur.

## 2. Périmètre retenu pour cette réalisation

Décision explicite : **la synchronisation API REST avec l'ERP Odoo et le canal temps réel WebSocket
(WSS) sont hors périmètre** de cette réalisation. Le cahier des charges les mentionne comme des
points d'intégration attendus par le volet RMS, mais nous nous concentrons sur la construction du
système de réclamation lui-même avec le framework déjà en place. Le code existant respecte déjà
cette limite : ces deux points n'existent que sous forme de commentaires « point d'extension » dans
`src/lib/claims.functions.ts`, jamais implémentés — rien à retirer, seulement à ne pas développer.

Restent en revanche dans le périmètre (ils ne dépendent pas d'une API externe ni de WebSocket) :

- Le référentiel juridique et le moteur de qualification.
- La machine à états du dossier de réclamation.
- Les 3 écrans (portail client, dashboard agent, dashboard analytics/KPIs).
- L'authentification par rôle et les règles d'accès.
- La conformité RGPD applicative (consentement, minimisation des données).

Le durcissement infra (conteneurisation Docker, scan qualité SonarQube) reste secondaire par rapport
à la construction fonctionnelle du système ; il est noté en fin de feuille de route mais n'est pas
prioritaire tant que l'application elle-même n'est pas consolidée.

## 3. Stack technique en place

Le projet n'est pas à démarrer de zéro : il a été initialement généré via Lovable et repose sur une
stack déjà installée et cohérente avec le cahier des charges (« Frontend React + Tailwind,
Backend Supabase ») :

- **Frontend** : React 19, TanStack Start (SSR) + TanStack Router (routing fichier) + TanStack Query
  (data fetching/mutations), Vite 8.
- **UI** : Tailwind CSS v4 + shadcn/ui (Radix UI), thème « dossier officiel » (encre marine, papier
  grisé, laiton, vert forêt, brique) déjà configuré dans `src/styles.css`.
- **Formulaires / validation** : react-hook-form + Zod.
- **Graphiques** : Recharts (barres par pays, camembert par motif).
- **Backend / persistance** : Supabase (Postgres + Auth + RLS). Pas de serveur applicatif séparé :
  la logique serveur vit dans des _server functions_ TanStack Start (`createServerFn`) qui appellent
  directement Supabase — cela fait office de couche API interne sans exposer de surface REST.
- **Gestionnaire de paquets** : `bun.lock` présent (Bun), mais `npm i` fonctionne également.
- **Qualité** : ESLint 9 (flat config) + Prettier. Aucun test automatisé n'est configuré à ce jour.

## 4. Architecture du code

```
src/
├── routes/                        routage fichier TanStack Start
│   ├── index.tsx                  page vitrine publique
│   ├── auth.tsx                   connexion / création de compte
│   └── _authenticated/            groupe protégé (garde de session)
│       ├── route.tsx              beforeLoad → redirection /auth si non connecté
│       ├── portail.tsx            écran client
│       ├── agent.tsx              écran agent
│       └── analytics.tsx          écran manager
├── components/claimdesk/          AppShell, DossierNav, StatutStamp (composants métier)
├── components/ui/                 primitives shadcn/ui (boilerplate)
├── lib/
│   ├── qualification.ts           moteur de règles juridiques (fonction pure, sans I/O)
│   └── claims.functions.ts        server functions = couche d'accès aux données + actions métier
└── integrations/supabase/         client Supabase, middleware d'auth, types générés
supabase/migrations/*.sql          schéma de base (tables, enums, RLS, trigger)
```

Le pattern est **route-par-écran** plutôt que MVC classique : chaque route embarque son UI et ses
hooks de données ; la logique métier pure (qualification) est bien séparée de l'accès aux données
(server functions) ; l'autorisation est appliquée en défense en profondeur (vérification applicative

- Row Level Security côté base).

## 5. Modèle de données (Supabase / Postgres)

Table centrale `public.claims` : `id`, `numero_dossier` (auto, format `CD-AAAA-N`), `client_id`,
`client_nom`, `pays`, `produit`, `type_reclamation` (enum), `description`, `date_achat`,
`date_livraison`, `date_creation`, `statut` (enum), `recevable`, `motif_qualification`, `remede`,
`temps_traitement_jours`, `agent_assigne_id`, `commentaire_interne`, `consentement_rgpd`,
`date_resolution`.

Enums : `app_role` (client/agent/manager), `claim_type` (retractation/non_conformite/livraison/
facturation), `claim_status` (cree/qualifie/rejete/instruction/resolu/escalade).

Tables annexes : `profiles` (nom, consentement RGPD) et `user_roles` (rôle par utilisateur, table
séparée pour éviter l'élévation de privilège via la table profil elle-même — bonne pratique).
Un trigger `handle_new_user()` crée automatiquement le profil et le rôle à l'inscription.

## 6. Rôles et sécurité

3 rôles : **client** (dépose et suit ses propres dossiers), **agent** (traite tous les dossiers,
peut faire évoluer le statut et ajouter des commentaires internes), **manager** (accès en plus au
dashboard analytics). Le contrôle d'accès est appliqué à trois niveaux : garde de route côté
front (`_authenticated/route.tsx`), vérification de rôle côté server functions (`assertStaff`,
restriction manager sur `dossiersAnalytics`), et policies RLS côté Postgres.

## 7. Moteur de qualification juridique

Implémenté dans `src/lib/qualification.ts`, fonction pure `qualifier()` :

- **Rétractation** : recevable si ≤ 14 jours calendaires depuis `date_livraison` (directive
  2011/83/UE) → remboursement intégral ; rejeté au-delà.
- **Non-conformité** : rejeté si ≥ 24 mois depuis `date_achat` (fin de garantie légale) ; si
  < 12 mois depuis livraison, défaut présumé antérieur, charge de la preuve au vendeur (directive
  2019/771) → réparation/remplacement/remboursement ; sinon recevable avec charge de la preuve
  côté consommateur.
- **Litige de livraison** et **erreur de facturation** : toujours recevables, passent en
  `instruction` pour vérification (transporteur / comptable).

Point d'attention : la matrice de qualification du cahier des charges est présentée comme
**multi-pays** (« règles de recevabilité, lois applicables par pays, délais de prescription »),
mais l'implémentation actuelle applique une règle harmonisée unique quel que soit le `pays`
sélectionné — c'est un choix de simplification MVP assumé par le prompt d'origine, mais cela ne
couvre pas encore la promesse « diversité des législations nationales » du volet CIB.

## 8. Correspondance avec les livrables du cahier des charges

| #   | Livrable attendu                                                    | Pôle    | État dans le code actuel                                                                                                    |
| --- | ------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| L1  | Spécification juridique & matrice de qualification                  | CIB     | Partiel — moteur de règles codé, mais règles harmonisées UE, pas encore différenciées par pays                              |
| L2  | Module backend & moteur de règles                                   | RMS     | Fait — `qualification.ts` + machine à états (`claim_status`)                                                                |
| L3  | APIs Odoo & WebSockets                                              | RMS     | **Hors périmètre** (décision de ce cadrage) — seulement des commentaires d'extension dans le code                           |
| L4  | Maquettes UI/UX & templates de communication                        | MCM     | Partiel — 3 écrans stylés et fonctionnels ; pas de templates d'e-mail de notification                                       |
| L5  | Dashboard analytics & pilotage data                                 | EGP/CIB | Fait — `/analytics` avec KPIs, graphiques pays/motif, filtres                                                               |
| L6  | Dossier d'architecture & conformité cyber (Docker, SonarQube, RGPD) | RMS/EGP | Non fait — pas de Dockerfile, pas de SonarQube ; RGPD partiellement couvert (consentement stocké, pas de purge automatique) |

## 9. État d'avancement actuel — constat honnête

Ce n'est **pas un projet à construire depuis zéro** : c'est un MVP déjà largement fonctionnel
(~2 600 lignes de code applicatif hors composants shadcn boilerplate). Les 3 écrans, l'auth par
rôle, le moteur de qualification et le schéma de base avec RLS sont opérationnels de bout en bout.
Le travail restant est un travail d'**approfondissement et de durcissement**, pas de création
initiale.

## 10. Avis technique et points de vigilance

- **Risque de sécurité réel — corrigé le 2026-08-05** : à l'inscription, l'utilisateur choisissait
  librement son rôle (client/agent/manager), y compris en contournant l'UI en appelant directement
  l'API Supabase avec un `role` forgé dans les métadonnées. Le trigger `handle_new_user()` ignore
  désormais ce champ et force toujours `client` ; l'attribution agent/manager passe par la nouvelle
  action manager `attribuerRole` (panneau dans `/analytics`). Voir §11, priorité 1, point 1.
- **`.env` versionné** : le fichier `.env` contenant l'URL et la clé Supabase (publique/publishable,
  donc pas un secret critique) est suivi par le projet et n'est pas exclu par `.gitignore`. À
  clarifier/nettoyer par hygiène, même si la clé est de type "publishable".
- **Qualification non différenciée par pays** : comme noté en §7, malgré la collecte du champ
  `pays`, la logique de qualification ne varie pas selon la législation nationale — écart avec
  l'ambition du cahier des charges (volet CIB) à combler si la dimension multi-pays est jugée
  essentielle pour la suite.
- **Aucun test automatisé** : le moteur de qualification est le composant le plus critique
  juridiquement (impact direct sur les droits du consommateur) et n'a aucune couverture de test.
  C'est la première chose à sécuriser par des tests unitaires avant d'ajouter de nouvelles règles.
- **RGPD partiel** : le consentement est bien capturé et obligatoire au dépôt, mais la purge des
  dossiers résolus après un délai (mentionnée en commentaire) n'est pas implémentée.
- **Pas de pagination** sur les listes de dossiers (`tousLesDossiers`, `mesDossiers`) — non
  bloquant au stade actuel mais à surveiller si le volume de réclamations augmente.

Dans l'ensemble, la base est saine : séparation claire logique métier / accès aux données,
défense en profondeur pour les autorisations, respect du système de design demandé. Le principal
écart entre l'intention du cahier des charges et l'implémentation concerne la faille de rôle à
l'inscription et l'absence de différenciation juridique par pays.

## 11. Feuille de route proposée

**Priorité 1 — Sécurité et fiabilité**

1. ~~Retirer le choix de rôle du formulaire d'inscription public~~ **Fait** (2026-08-05) :
   `handle_new_user()` ignore désormais tout rôle transmis par le client et attribue toujours
   `client` (migration `20260805120000_fix_signup_role_escalation.sql`) ; le sélecteur de rôle a
   été retiré de `auth.tsx`. Une nouvelle fonction serveur manager-only `attribuerRole` (dans
   `claims.functions.ts`) et un panneau « Attribution des rôles » dans `/analytics` permettent à un
   manager de promouvoir un compte (agent/manager) par e-mail — colonne `profiles.email` ajoutée à
   cet effet, avec policy RLS dédiée pour la lecture par les managers.
2. Ajouter des tests unitaires sur `qualifier()` (tous les cas limites : jour 14 pile,
   23 mois/24 mois, absence de `date_livraison`, etc.). _(Reste à faire — nécessite d'introduire un
   test runner, aucun n'est encore configuré dans le projet.)_

**Priorité 2 — Fidélité au cahier des charges** 3. Étendre le moteur de qualification pour tenir compte du `pays` (au minimum une table de
variantes par pays sur les délais/remèdes, même simplifiée). 4. Ajouter les templates de communication client (e-mail de confirmation de dépôt, de changement
de statut) — mentionnés au volet MCM, absents du code actuel.

**Priorité 3 — Conformité et exploitation** 5. Implémenter la purge RGPD des dossiers résolus au-delà du délai de conservation. 6. Ajouter pagination/tri sur les tables de dossiers agent/client si le volume le justifie. 7. (Optionnel, non prioritaire) Conteneurisation Docker et intégration SonarQube pour le volet
RMS/L6, une fois le socle fonctionnel stabilisé.

Explicitement non planifié dans cette feuille de route : synchronisation API Odoo, canal
WebSocket temps réel (hors périmètre, cf. §2).

## 12. Commandes utiles

```sh
npm i            # installation des dépendances (bun i fonctionne aussi, bun.lock présent)
npm run dev      # serveur de développement (Vite)
npm run build    # build de production
npm run preview  # prévisualisation du build
npm run lint     # ESLint
npm run format   # Prettier (écriture)
```

Aucune commande de test n'existe actuellement (`npm test`) — à ajouter avec le framework de test
retenu (voir Priorité 1, point 2).

Le projet nécessite les variables d'environnement Supabase déjà présentes dans `.env`
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, etc.) pour se connecter à l'instance
Supabase existante (schéma déjà migré via `supabase/migrations/*.sql`).
