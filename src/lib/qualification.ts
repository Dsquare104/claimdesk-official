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

export type TypeReclamation =
  | "retractation"
  | "non_conformite"
  | "livraison"
  | "facturation";

export type Statut =
  | "cree"
  | "qualifie"
  | "rejete"
  | "instruction"
  | "resolu"
  | "escalade";

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
  const achat = new Date(input.date_achat);
  const livraison = input.date_livraison ? new Date(input.date_livraison) : null;

  switch (input.type_reclamation) {
    case "retractation": {
      if (!livraison) {
        return {
          recevable: false,
          statut: "rejete",
          motif_qualification:
            "Rétractation non qualifiable : la date de livraison est requise pour calculer le délai légal de 14 jours calendaires.",
          remede: null,
        };
      }
      const jours = joursEntre(livraison, today);
      if (jours <= 14) {
        return {
          recevable: true,
          statut: "qualifie",
          motif_qualification: `Rétractation exercée ${jours} jour(s) après la livraison, soit dans le délai légal de 14 jours calendaires (directive 2011/83/UE). Dossier recevable.`,
          remede: "Remboursement intégral",
        };
      }
      return {
        recevable: false,
        statut: "rejete",
        motif_qualification: `Rétractation exercée ${jours} jours après la livraison, au-delà du délai légal de 14 jours calendaires. Dossier non recevable à ce titre.`,
        remede: null,
      };
    }

    case "non_conformite": {
      const moisAchat = moisEntre(achat, today);
      if (moisAchat >= 24) {
        return {
          recevable: false,
          statut: "rejete",
          motif_qualification: `Achat effectué il y a ${moisAchat} mois : la garantie légale de conformité de 24 mois est expirée. Dossier non recevable.`,
          remede: null,
        };
      }
      const moisLivraison = livraison ? moisEntre(livraison, today) : moisAchat;
      if (moisLivraison < 12) {
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
        motif_qualification: `Achat il y a ${moisAchat} mois, dans la garantie légale de 24 mois. Au-delà de 12 mois après la livraison, la charge de la preuve du défaut incombe au consommateur. Dossier recevable.`,
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