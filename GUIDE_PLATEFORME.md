# ClaimDesk — Guide de fonctionnement de la plateforme

Ce document explique comment fonctionne ClaimDesk du point de vue métier et
utilisateur : qui fait quoi, comment un dossier avance, comment il est qualifié
juridiquement, et comment démarrer. Pour l'architecture technique et les
commandes de développement, voir `CLAUDE.md`. Pour l'historique du cadrage et
la feuille de route, voir `PROJET_CLAIMDESK.md`.

## 1. À quoi sert ClaimDesk

ClaimDesk centralise et qualifie les réclamations clients d'OMNIVIA (e-commerçant
opérant en France, Allemagne, Espagne, Italie, Belgique, Pays-Bas et Pologne) :
rétractation, non-conformité produit, litige de livraison, erreur de facturation.
Chaque dossier est qualifié juridiquement dès son dépôt au regard du droit
européen de la consommation, puis suivi jusqu'à résolution ou escalade vers un
médiateur.

## 2. Les trois profils

| Profil | Ce qu'il peut faire | Écrans accessibles |
|---|---|---|
| **Client** | Déposer une réclamation, suivre l'avancement de ses propres dossiers | Portail client, Mes dossiers |
| **Agent** | Voir tous les dossiers, les faire avancer (instruction, résolu, escalade), ajouter un commentaire interne | Traitement |
| **Manager** | Tout ce que fait l'agent, + piloter les KPI, attribuer les rôles agent/manager, purger les dossiers RGPD | Traitement, Analytics, Équipe |

Un compte n'a **que le rôle qui lui a été attribué** : la navigation
n'affiche que les onglets correspondants (un client ne voit jamais les onglets
Traitement/Analytics/Équipe, même s'il tente d'y accéder directement l'accès
est refusé côté serveur).

### Comment un compte obtient un rôle

À l'inscription (`/auth`), **tout nouveau compte est créé avec le rôle
client**, sans exception — il n'y a plus de sélecteur de rôle au formulaire
d'inscription. Un manager promeut ensuite un compte existant vers `agent` ou
`manager` depuis l'onglet **Équipe**, à partir de son adresse e-mail. C'est
volontaire : cela évite qu'un compte s'auto-attribue un rôle sensible en
contournant l'interface.

## 3. Cycle de vie d'un dossier

```
Créé → Qualifié → Instruction → Résolu
              ↘             ↘
             Rejeté        Escaladé (médiateur)
```

- **Créé → Qualifié/Rejeté** : automatique, à la seconde même du dépôt, par le
  moteur de qualification (voir §4). Le client voit le résultat immédiatement.
- **Qualifié → Instruction** : un agent prend le dossier en main pour
  vérification complémentaire (transporteur, comptabilité...).
- **Instruction → Résolu** : l'agent marque le dossier résolu ; le délai de
  traitement (en jours) est calculé et enregistré automatiquement.
- **→ Escaladé** : à tout moment, un agent peut transmettre le dossier au
  médiateur de la consommation (action confirmée par une boîte de dialogue,
  car visible par le client).

Chaque changement de statut déclenche la génération d'un e-mail de
notification pour le client (voir §6 — l'envoi réel n'est pas encore branché
à ce jour).

## 4. Le moteur de qualification juridique

Le cœur métier de ClaimDesk est une fonction pure (`qualifier()`,
`src/lib/qualification.ts`) qui applique des règles issues des directives
européennes de protection des consommateurs :

- **Rétractation** (directive 2011/83/UE) : recevable si exercée dans les
  **14 jours calendaires** suivant la livraison → remboursement intégral.
  Rejetée au-delà.
- **Non-conformité produit** (directive (UE) 2019/771) : recevable si l'achat
  date de moins de **24 mois** (garantie légale). Si le défaut est signalé
  dans une fenêtre de **présomption** (variable selon le pays, voir
  ci-dessous), le défaut est présumé antérieur à la livraison et la charge de
  la preuve incombe au vendeur ; au-delà, la charge de la preuve passe au
  consommateur.
- **Litige de livraison** et **erreur de facturation** : toujours recevables
  de plein droit, passent directement en instruction pour vérification.

### Règles différenciées par pays

Le délai de rétractation (14 jours) et la durée de garantie légale (24 mois)
sont harmonisés au niveau européen — aucune variante n'a été trouvée entre les
7 pays d'OMNIVIA. En revanche, la **période de présomption de défaut** varie
réellement selon le choix fait par chaque État membre lors de la transposition
(la directive fixe un plancher de 12 mois, que chaque pays peut porter à 24
mois) :

| Pays | Présomption de défaut |
|---|---|
| France, Espagne, Belgique, Pologne | 24 mois |
| Allemagne, Italie, Pays-Bas | 12 mois |

Ces valeurs sont une synthèse de recherche (sources citées en commentaire
dans `qualification.ts`), **pas un avis juridique formel** — à faire valider
par un juriste local avant une exploitation commerciale réelle.

## 5. Les écrans de l'application

- **`/portail`** (client) — formulaire de dépôt d'une réclamation. Le résultat
  de la qualification (recevable ou non, motif, remède applicable) s'affiche
  immédiatement après soumission.
- **`/mes-dossiers`** (client) — liste paginée des réclamations du client, avec
  un stepper visuel (Créé → Qualifié → Instruction → Résolu) pour chaque
  dossier.
- **`/agent`** (agent, manager) — tableau de tous les dossiers, filtrable par
  pays/statut/motif (filtres appliqués côté serveur, avec pagination). Un clic
  sur une ligne ouvre le détail : qualification complète, actions
  (instruction / résolu / escalade), commentaire interne.
- **`/analytics`** (manager) — KPI (taux de résolution au premier contact,
  délai moyen de traitement, dossiers en cours, total), graphique des dossiers
  par pays, répartition par motif, filtres par période et par pays.
- **`/equipe`** (manager) — attribution des rôles agent/manager par e-mail, et
  purge RGPD des dossiers résolus (voir §7).

## 6. Notifications e-mail

Deux e-mails sont générés (contenu HTML + texte, dans l'identité visuelle
ClaimDesk) :

- **Confirmation de dépôt**, envoyé juste après la création d'un dossier.
- **Changement de statut**, envoyé à chaque évolution réelle du statut d'un
  dossier (pas si le statut ne change pas).

⚠️ **Aucun fournisseur d'e-mail n'est branché à ce jour** (pas de compte
Resend/SendGrid/Postmark ni de SMTP configuré). Le contenu est généré et
journalisé côté serveur, mais rien n'est envoyé pour de vrai tant qu'un
fournisseur n'aura pas été connecté (`src/lib/notifications.ts`).

## 7. RGPD

- Le consentement au traitement des données est obligatoire au dépôt d'une
  réclamation (case à cocher, non contournable).
- Seules les données strictement nécessaires au traitement du dossier sont
  collectées.
- Un manager peut purger définitivement, depuis `/equipe`, tous les dossiers
  **résolus depuis plus de 3 ans** (bouton avec confirmation, action
  irréversible). Ce déclenchement est **manuel**, pas automatique : si
  personne ne clique, rien ne se supprime tout seul. La base de données
  elle-même restreint cette suppression aux managers et aux seuls dossiers
  éligibles, même en cas de bug côté application.

## 8. Démarrer / tester la plateforme

Des comptes de démonstration existent pour explorer les trois profils sans
créer de compte manuellement (voir `scripts/seed-demo-users.ts` et
`supabase/seed-roles.sql`) :

| Rôle | E-mail |
|---|---|
| Client | `client1.demo@claimdesk.test` |
| Client | `client2.demo@claimdesk.test` |
| Agent | `agent.demo@claimdesk.test` |
| Manager | `manager.demo@claimdesk.test` |

Ces comptes possèdent déjà des dossiers de démonstration variés (voir
`scripts/seed-demo-claims.ts`), utiles pour observer la pagination, les
filtres et le tableau de bord analytics avec des données réalistes plutôt
qu'à vide.

## 9. Ce qui n'est délibérément pas dans le périmètre actuel

- **Synchronisation ERP Odoo** et **canal WebSocket temps réel** — écartés dès
  le cadrage initial du projet, seuls des points d'extension en commentaire
  existent dans le code (`src/lib/claims.functions.ts`).
- **Conteneurisation Docker / intégration SonarQube** — jugés non prioritaires
  tant que le socle fonctionnel n'était pas consolidé ; décision confirmée de
  ne pas les traiter.
- **Envoi réel des e-mails** — voir §6.
- **Purge RGPD automatique** (ex. tâche planifiée) — voir §7, choix délibéré
  de garder cette action sous contrôle humain.
