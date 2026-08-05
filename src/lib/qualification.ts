/**
 * Moteur de qualification juridique ClaimDesk.
 *
 * Règles harmonisées par les directives UE (2011/83/UE — droit de rétractation,
 * 2019/771 — conformité des biens), simplifiées pour le MVP.
 * À affiner avec un juriste avant mise en production.
 */

export const PAYS_UE = [
  "France",
  "Allemagne",
  "Espagne",
  "Italie",
  "Belgique",
  "Pays-Bas",
  "Pologne",
] as const;

export type Pays = (typeof PAYS_UE)[number];

export interface CountryRules {
  retractationDelaiJours: number;
  nonConformiteGarantieMois: number;
  nonConformitePresomptionMois: number;
}

// Socle harmonisé par les directives UE (2011/83/UE — droit de rétractation ;
// (UE) 2019/771 — conformité des biens, article 11(1)). Ce sont des planchers communs
// à tous les États membres, pas des valeurs figées : les directives laissent des marges
// de manœuvre nationales (ex. la période de présomption de défaut de l'article 11(1) peut
// être portée jusqu'à 24 mois par un État membre au lieu du plancher de 12).
const REGLES_HARMONISEES_UE: CountryRules = {
  retractationDelaiJours: 14,
  nonConformiteGarantieMois: 24,
  nonConformitePresomptionMois: 12,
};

// Valeurs de délai de rétractation et de garantie légale : recherche menée (août 2026)
// sans trouver de variante nationale parmi ces 7 pays au-delà du socle harmonisé UE — les
// deux restent alignées sur le plancher partout. Seule la période de présomption de défaut
// (article 11(1) de la directive (UE) 2019/771) varie réellement d'un pays à l'autre, les
// États membres ayant chacun choisi entre le plancher de 12 mois et l'option à 24 mois.
// Sources (transpositions nationales, vérifiées août 2026) :
//   France    : Code de la consommation, art. L217-7 (Ord. 2021-1247) — 24 mois
//   Allemagne : BGB § 477 (réforme au 1er janvier 2022) — 12 mois
//   Espagne   : RDL 1/2007, art. 121 (RDL 7/2021, en vigueur 1er janvier 2022) — 24 mois
//   Italie    : Codice del Consumo, art. 132 (D.Lgs. 170/2021) — 12 mois
//   Belgique  : Code de droit économique (en vigueur 1er juin 2022) — 24 mois
//   Pays-Bas  : Burgerlijk Wetboek, art. 7:18 al. 2 (en vigueur 1er janvier 2022) — 12 mois
//   Pologne   : Kodeks cywilny, art. 556² (loi du 4 novembre 2022) — 24 mois
// Ceci reste une synthèse de recherche, pas un avis juridique : le droit évolue et chaque
// valeur doit être validée par un juriste local avant mise en production.
export const REGLES_PAR_PAYS: Record<Pays, CountryRules> = {
  France: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 24 },
  Allemagne: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 12 },
  Espagne: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 24 },
  Italie: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 12 },
  Belgique: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 24 },
  "Pays-Bas": { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 12 },
  Pologne: { ...REGLES_HARMONISEES_UE, nonConformitePresomptionMois: 24 },
};

export function reglesPour(pays: Pays): CountryRules {
  return REGLES_PAR_PAYS[pays] ?? REGLES_HARMONISEES_UE;
}

export type TypeReclamation = "retractation" | "non_conformite" | "livraison" | "facturation";

export type Statut = "cree" | "qualifie" | "rejete" | "instruction" | "resolu" | "escalade";

export const LIBELLES_TYPE: Record<TypeReclamation, string> = {
  retractation: "Rétractation",
  non_conformite: "Non-conformité produit",
  livraison: "Litige de livraison",
  facturation: "Erreur de facturation",
};

export const LIBELLES_STATUT: Record<Statut, string> = {
  cree: "Créé",
  qualifie: "Qualifié",
  rejete: "Rejeté",
  instruction: "Instruction",
  resolu: "Résolu",
  escalade: "Escaladé",
};

export interface QualificationInput {
  pays: Pays;
  type_reclamation: TypeReclamation;
  date_achat: string;
  date_livraison?: string | null;
}

export interface QualificationResult {
  recevable: boolean;
  statut: Statut;
  motif_qualification: string;
  remede: string | null;
}

function joursEntre(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function moisEntre(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) -
    (to.getDate() < from.getDate() ? 1 : 0)
  );
}

export function qualifier(
  input: QualificationInput,
  today: Date = new Date(),
): QualificationResult {
  const regles = reglesPour(input.pays);
  const achat = new Date(input.date_achat);
  const livraison = input.date_livraison ? new Date(input.date_livraison) : null;

  switch (input.type_reclamation) {
    case "retractation": {
      if (!livraison) {
        return {
          recevable: false,
          statut: "rejete",
          motif_qualification: `Rétractation non qualifiable : la date de livraison est requise pour calculer le délai légal de ${regles.retractationDelaiJours} jours calendaires.`,
          remede: null,
        };
      }
      const jours = joursEntre(livraison, today);
      if (jours <= regles.retractationDelaiJours) {
        return {
          recevable: true,
          statut: "qualifie",
          motif_qualification: `Rétractation exercée ${jours} jour(s) après la livraison, soit dans le délai légal de ${regles.retractationDelaiJours} jours calendaires (directive 2011/83/UE). Dossier recevable.`,
          remede: "Remboursement intégral",
        };
      }
      return {
        recevable: false,
        statut: "rejete",
        motif_qualification: `Rétractation exercée ${jours} jours après la livraison, au-delà du délai légal de ${regles.retractationDelaiJours} jours calendaires. Dossier non recevable à ce titre.`,
        remede: null,
      };
    }

    case "non_conformite": {
      const moisAchat = moisEntre(achat, today);
      if (moisAchat >= regles.nonConformiteGarantieMois) {
        return {
          recevable: false,
          statut: "rejete",
          motif_qualification: `Achat effectué il y a ${moisAchat} mois : la garantie légale de conformité de ${regles.nonConformiteGarantieMois} mois est expirée. Dossier non recevable.`,
          remede: null,
        };
      }
      const moisLivraison = livraison ? moisEntre(livraison, today) : moisAchat;
      if (moisLivraison < regles.nonConformitePresomptionMois) {
        return {
          recevable: true,
          statut: "qualifie",
          motif_qualification: `Défaut signalé ${moisLivraison} mois après la livraison : le défaut est présumé antérieur à la délivrance, la charge de la preuve incombe au vendeur (directive UE 2019/771). Dossier recevable.`,
          remede: "Réparation, remplacement ou remboursement",
        };
      }
      return {
        recevable: true,
        statut: "qualifie",
        motif_qualification: `Achat il y a ${moisAchat} mois, dans la garantie légale de ${regles.nonConformiteGarantieMois} mois. Au-delà de ${regles.nonConformitePresomptionMois} mois après la livraison, la charge de la preuve du défaut incombe au consommateur. Dossier recevable.`,
        remede: "Réparation ou remplacement",
      };
    }

    case "livraison":
      return {
        recevable: true,
        statut: "instruction",
        motif_qualification:
          "Litige de livraison : recevable de plein droit, le vendeur est responsable du bien jusqu'à sa réception effective. Vérification transporteur en cours.",
        remede: "Réexpédition ou remboursement selon vérification transporteur",
      };

    case "facturation":
      return {
        recevable: true,
        statut: "instruction",
        motif_qualification:
          "Erreur de facturation : recevable de plein droit. Vérification comptable du montant facturé en cours.",
        remede: "Avoir ou remboursement du trop-perçu",
      };
  }
}
