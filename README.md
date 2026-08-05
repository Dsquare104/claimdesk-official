# ClaimDesk Official

Prompt à coller dans Lovable

Construis ClaimDesk, un module SaaS de gestion des réclamations clients pour OMNIVIA, un e-commerçant transfrontalier opérant dans 7 pays de l'UE (France, Allemagne, Espagne, Italie, Belgique, Pays-Bas, Pologne).

Contexte métier

OMNIVIA reçoit des réclamations clients (rétractation, non-conformité produit, litige de livraison, erreur de facturation) et doit les qualifier juridiquement selon le droit européen de la consommation, puis les traiter jusqu'à résolution. L'app doit relier trois profils : client final, agent de traitement, et management (analytics).

Stack attendue

Frontend : React + Tailwind

Backend : Supabase (base de données + auth + Edge Functions), activé nativement dans Lovable

Auth : email/mot de passe, avec 2 rôles (client, agent) et redirection selon le rôle après connexion

Modèle de données (table claims)

Champ Type Détail id uuid clé primaire numero_dossier text ex. CD-2026-1042, généré automatiquement client_id uuid référence utilisateur client_nom text pays text un des 7 pays UE listés produit text type_reclamation enum retractation, non_conformite, livraison, facturation description text date_achat date date_livraison date date_creation timestamp auto statut enum cree, qualifie, rejete, instruction, resolu, escalade recevable boolean résultat du moteur de règles motif_qualification text explication générée par le moteur remede text remède applicable (remboursement, réparation, remplacement, avoir) temps_traitement_jours integer calculé à la résolution agent_assigne_id uuid nullable

Moteur de qualification (logique métier à implémenter côté backend/Edge Function)

Règles harmonisées par les directives UE (simplifiées pour le MVP, à affiner ensuite avec un juriste) :

Rétractation : recevable si la date du jour est dans les 14 jours calendaires suivant date_livraison → remède : remboursement intégral. Sinon rejeté.

Non-conformité : recevable si moins de 24 mois depuis date_achat (garantie légale). Si moins de 12 mois depuis date_livraison, défaut présumé antérieur (charge de la preuve au vendeur) → remède : réparation/remplacement/remboursement. Au-delà de 24 mois : rejeté.

Litige de livraison : toujours recevable, passe en instruction pour vérification transporteur.

Erreur de facturation : toujours recevable, passe en instruction pour vérification comptable.

Le moteur doit renvoyer : recevable, statut, motif_qualification (phrase explicative), remede.

Écrans à produire

1. Portail client (/portail)

Formulaire de dépôt de réclamation (nom, pays, produit, type, dates, description)

À la soumission : appel du moteur de qualification, affichage immédiat du résultat (recevable/rejeté, remède, motif)

Stepper visuel de statut : Créé → Qualifié → Instruction → Résolu (ou Rejeté/Escaladé)

Liste "Mes dossiers" avec statut de chacun

2. Dashboard agent (/agent)

Table de tous les dossiers avec filtres (pays, statut, type)

Panneau de détail au clic : infos dossier + résultat du moteur de qualification affiché clairement

Actions : passer en instruction, marquer résolu, escalader vers médiateur (avec confirmation)

Champ commentaire interne par dossier

3. Dashboard analytics (/analytics, réservé aux managers)

KPI cards : taux de résolution au premier contact, temps moyen de traitement, nombre de dossiers en cours, total dossiers

Graphique en barres : dossiers par pays

Graphique circulaire : répartition par motif de réclamation

Filtre par période et par pays

Direction visuelle

Univers "dossier officiel / conformité européenne" — sérieux, rassurant, orienté confiance et sécurité juridique. Pas de style startup générique fun-coloré.

Couleurs : encre marine (#12203A) pour les en-têtes et navigation, papier grisé-clair (#EEEEE4) pour le fond, laiton/bronze (#B08A3E) comme accent (boutons secondaires, badges), vert forêt sourd (#3E6355) pour "résolu/conforme", brique sourde (#B0472B) pour "urgent/rejeté".

Typographie : une police serif pour les titres (esprit document officiel), une police sans-serif neutre pour le corps de texte, une police mono pour les numéros de dossier.

Élément signature : chaque dossier affiche un badge en forme de "tampon" (pill arrondie avec icône de sceau) indiquant son statut — cette métaphore du tampon officiel doit être cohérente dans toute l'app.

Navigation par onglets façon "chemise de dossier" en haut de page.

Notes d'intégration (à prévoir en commentaire dans le code, pas à développer dans ce MVP)

Prévoir un point d'extension pour une future synchronisation API REST avec un ERP Odoo (endpoints GET/POST /api/claims, webhook de mise à jour de statut)

Prévoir un point d'extension pour un canal WebSocket de mise à jour temps réel du statut des dossiers côté client

Le RGPD s'applique : ne pas stocker de données client au-delà du nécessaire, prévoir un champ de consentement

Livrable attendu de Lovable

Une application fonctionnelle avec les 3 écrans, l'authentification par rôle, le moteur de qualification opérationnel, et les données persistées dans Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/50a38691-0056-4da7-ae66-c4874cfc347f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
