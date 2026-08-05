// Script de démo/test — peuple des réclamations pour les comptes créés par
// seed-demo-users.ts, afin d'avoir des données réalistes à parcourir dans
// /mes-dossiers (client), /agent (traitement) et /analytics (manager).
//
// Usage : bun run scripts/seed-demo-claims.ts
// Prérequis : avoir déjà lancé seed-demo-users.ts ET supabase/seed-roles.sql
// (les comptes doivent être confirmés et agent.demo/manager.demo doivent avoir
// leurs rôles pour que les mises à jour de statut fonctionnent).

import { supabase } from "@/integrations/supabase/client";
import { qualifier, type Pays, type TypeReclamation } from "@/lib/qualification";

const MOT_DE_PASSE = "Cl4imD3sk-D3mo_2026!";

function ilYA(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  return d.toISOString().slice(0, 10);
}

interface DossierSeed {
  client_nom: string;
  pays: Pays;
  produit: string;
  type_reclamation: TypeReclamation;
  description: string;
  date_achat: string;
  date_livraison: string | null;
}

const DOSSIERS_CLIENT1: DossierSeed[] = [
  {
    client_nom: "Camille Dupont",
    pays: "France",
    produit: "Casque audio sans fil",
    type_reclamation: "retractation",
    description: "Le produit ne correspond pas à mes attentes, je souhaite le retourner.",
    date_achat: ilYA(20),
    date_livraison: ilYA(5),
  },
  {
    client_nom: "Camille Dupont",
    pays: "France",
    produit: "Aspirateur robot",
    type_reclamation: "retractation",
    description: "Rétractation hors délai, tentative de retour tardif.",
    date_achat: ilYA(60),
    date_livraison: ilYA(45),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Belgique",
    produit: "Machine à café",
    type_reclamation: "non_conformite",
    description: "La machine ne chauffe plus après trois semaines d'utilisation.",
    date_achat: ilYA(240),
    date_livraison: ilYA(230),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Pologne",
    produit: "Ordinateur portable",
    type_reclamation: "non_conformite",
    description: "Écran défectueux, lignes verticales visibles en permanence.",
    date_achat: ilYA(500),
    date_livraison: ilYA(490),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Espagne",
    produit: "Table basse",
    type_reclamation: "non_conformite",
    description: "Produit acheté il y a plus de deux ans, hors garantie légale.",
    date_achat: ilYA(800),
    date_livraison: ilYA(790),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Italie",
    produit: "Chaussures de randonnée",
    type_reclamation: "livraison",
    description: "Colis annoncé livré mais jamais reçu.",
    date_achat: ilYA(15),
    date_livraison: ilYA(10),
  },
  {
    client_nom: "Camille Dupont",
    pays: "France",
    produit: "Abonnement maintenance",
    type_reclamation: "facturation",
    description: "Facturé deux fois pour le même mois d'abonnement.",
    date_achat: ilYA(8),
    date_livraison: null,
  },
  {
    client_nom: "Camille Dupont",
    pays: "Allemagne",
    produit: "Vélo électrique",
    type_reclamation: "non_conformite",
    description: "Batterie ne tient plus la charge après deux mois.",
    date_achat: ilYA(70),
    date_livraison: ilYA(60),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Pays-Bas",
    produit: "Imprimante",
    type_reclamation: "retractation",
    description: "Changement d'avis, produit encore neuf dans son emballage.",
    date_achat: ilYA(10),
    date_livraison: ilYA(3),
  },
  {
    client_nom: "Camille Dupont",
    pays: "France",
    produit: "Canapé trois places",
    type_reclamation: "livraison",
    description: "Livraison endommagée, canapé rayé à la réception.",
    date_achat: ilYA(25),
    date_livraison: ilYA(18),
  },
  {
    client_nom: "Camille Dupont",
    pays: "Belgique",
    produit: "Frais de port",
    type_reclamation: "facturation",
    description: "Frais de port facturés alors que la livraison était annoncée gratuite.",
    date_achat: ilYA(4),
    date_livraison: null,
  },
];

const DOSSIERS_CLIENT2: DossierSeed[] = [
  {
    client_nom: "Marta Kowalczyk",
    pays: "Pologne",
    produit: "Téléviseur 55 pouces",
    type_reclamation: "non_conformite",
    description: "Panneau LED présente des pixels morts depuis la livraison.",
    date_achat: ilYA(150),
    date_livraison: ilYA(140),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Pologne",
    produit: "Sac à dos de randonnée",
    type_reclamation: "retractation",
    description: "Erreur de taille commandée, souhaite un remboursement.",
    date_achat: ilYA(12),
    date_livraison: ilYA(6),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Allemagne",
    produit: "Lave-linge",
    type_reclamation: "non_conformite",
    description: "Fuite d'eau constatée dès la première utilisation.",
    date_achat: ilYA(400),
    date_livraison: ilYA(395),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Pays-Bas",
    produit: "Trottinette électrique",
    type_reclamation: "livraison",
    description: "Colis livré à une mauvaise adresse selon le transporteur.",
    date_achat: ilYA(9),
    date_livraison: ilYA(4),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Espagne",
    produit: "Renouvellement abonnement",
    type_reclamation: "facturation",
    description: "Montant prélevé supérieur au tarif annoncé lors de la souscription.",
    date_achat: ilYA(6),
    date_livraison: null,
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "France",
    produit: "Chaise de bureau",
    type_reclamation: "non_conformite",
    description: "Mécanisme d'inclinaison bloqué après un mois.",
    date_achat: ilYA(50),
    date_livraison: ilYA(42),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Italie",
    produit: "Appareil photo",
    type_reclamation: "retractation",
    description: "Rétractation largement hors délai légal.",
    date_achat: ilYA(90),
    date_livraison: ilYA(75),
  },
  {
    client_nom: "Marta Kowalczyk",
    pays: "Belgique",
    produit: "Matelas",
    type_reclamation: "non_conformite",
    description: "Affaissement anormal du matelas après six mois.",
    date_achat: ilYA(220),
    date_livraison: ilYA(210),
  },
];

async function seedPourClient(email: string, dossiers: DossierSeed[]) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: MOT_DE_PASSE,
  });
  if (authError || !authData.user) {
    console.error(`✗ Connexion impossible pour ${email} : ${authError?.message}`);
    return;
  }

  for (const d of dossiers) {
    const resultat = qualifier({
      pays: d.pays,
      type_reclamation: d.type_reclamation,
      date_achat: d.date_achat,
      date_livraison: d.date_livraison,
    });

    const { data: claim, error } = await supabase
      .from("claims")
      .insert({
        client_id: authData.user.id,
        client_nom: d.client_nom,
        pays: d.pays,
        produit: d.produit,
        type_reclamation: d.type_reclamation,
        description: d.description,
        date_achat: d.date_achat,
        date_livraison: d.date_livraison,
        consentement_rgpd: true,
        statut: resultat.statut,
        recevable: resultat.recevable,
        motif_qualification: resultat.motif_qualification,
        remede: resultat.remede,
      })
      .select("numero_dossier")
      .single();

    if (error) {
      console.error(`✗ ${email} — ${d.produit} : ${error.message}`);
      continue;
    }
    console.log(`✓ ${claim.numero_dossier} (${email}) — ${d.produit} → ${resultat.statut}`);
  }

  await supabase.auth.signOut();
}

async function avancerQuelquesDossiers() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "agent.demo@claimdesk.test",
    password: MOT_DE_PASSE,
  });
  if (authError || !authData.user) {
    console.error(`✗ Connexion agent impossible : ${authError?.message}`);
    return;
  }

  const { data: enInstruction } = await supabase
    .from("claims")
    .select("id, date_creation")
    .eq("statut", "instruction")
    .limit(3);

  for (const dossier of enInstruction ?? []) {
    const jours = Math.max(
      1,
      Math.round((Date.now() - new Date(dossier.date_creation).getTime()) / 86_400_000),
    );
    const { error } = await supabase
      .from("claims")
      .update({
        statut: "resolu",
        agent_assigne_id: authData.user.id,
        date_resolution: new Date().toISOString(),
        temps_traitement_jours: jours,
      })
      .eq("id", dossier.id);
    if (error) console.error(`✗ Résolution ${dossier.id} : ${error.message}`);
    else console.log(`✓ Dossier ${dossier.id} marqué résolu`);
  }

  await supabase.auth.signOut();
}

async function main() {
  await seedPourClient("client1.demo@claimdesk.test", DOSSIERS_CLIENT1);
  await seedPourClient("client2.demo@claimdesk.test", DOSSIERS_CLIENT2);
  await avancerQuelquesDossiers();
  console.log("\nTerminé.");
}

main();
