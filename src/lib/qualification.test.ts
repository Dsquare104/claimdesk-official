import { describe, expect, it } from "vitest";
import { PAYS_UE, REGLES_PAR_PAYS, qualifier, reglesPour } from "./qualification";

const TODAY = new Date("2026-01-15");

describe("reglesPour — règles par pays", () => {
  it("renvoie une entrée pour chacun des 7 pays UE", () => {
    for (const pays of PAYS_UE) {
      expect(REGLES_PAR_PAYS[pays]).toBeDefined();
      expect(reglesPour(pays)).toEqual(REGLES_PAR_PAYS[pays]);
    }
  });

  it("aligne délai de rétractation et garantie légale sur le socle harmonisé UE partout", () => {
    for (const pays of PAYS_UE) {
      expect(REGLES_PAR_PAYS[pays].retractationDelaiJours).toBe(14);
      expect(REGLES_PAR_PAYS[pays].nonConformiteGarantieMois).toBe(24);
    }
  });

  it("applique la période de présomption de défaut choisie par chaque pays (article 11(1) directive (UE) 2019/771)", () => {
    expect(REGLES_PAR_PAYS.France.nonConformitePresomptionMois).toBe(24);
    expect(REGLES_PAR_PAYS.Allemagne.nonConformitePresomptionMois).toBe(12);
    expect(REGLES_PAR_PAYS.Espagne.nonConformitePresomptionMois).toBe(24);
    expect(REGLES_PAR_PAYS.Italie.nonConformitePresomptionMois).toBe(12);
    expect(REGLES_PAR_PAYS.Belgique.nonConformitePresomptionMois).toBe(24);
    expect(REGLES_PAR_PAYS["Pays-Bas"].nonConformitePresomptionMois).toBe(12);
    expect(REGLES_PAR_PAYS.Pologne.nonConformitePresomptionMois).toBe(24);
  });
});

describe("qualifier — rétractation", () => {
  it("est recevable à exactement 14 jours après la livraison", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "retractation",
        date_achat: "2026-01-01",
        date_livraison: "2026-01-01",
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.statut).toBe("qualifie");
    expect(result.remede).toBe("Remboursement intégral");
  });

  it("est rejetée à 15 jours après la livraison", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "retractation",
        date_achat: "2025-12-31",
        date_livraison: "2025-12-31",
      },
      TODAY,
    );
    expect(result.recevable).toBe(false);
    expect(result.statut).toBe("rejete");
    expect(result.remede).toBeNull();
  });

  it("est rejetée / non qualifiable sans date de livraison", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "retractation",
        date_achat: "2026-01-01",
        date_livraison: null,
      },
      TODAY,
    );
    expect(result.recevable).toBe(false);
    expect(result.statut).toBe("rejete");
  });

  it("applique le même délai de rétractation quel que soit le pays (harmonisé UE, aucune variante trouvée)", () => {
    const france = qualifier(
      {
        pays: "France",
        type_reclamation: "retractation",
        date_achat: "2025-12-31",
        date_livraison: "2025-12-31",
      },
      TODAY,
    );
    const pologne = qualifier(
      {
        pays: "Pologne",
        type_reclamation: "retractation",
        date_achat: "2025-12-31",
        date_livraison: "2025-12-31",
      },
      TODAY,
    );
    expect(pologne).toEqual(france);
  });
});

describe("qualifier — non-conformité", () => {
  it("est rejetée à exactement 24 mois depuis l'achat", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "non_conformite",
        date_achat: "2024-01-15",
        date_livraison: "2024-01-15",
      },
      TODAY,
    );
    expect(result.recevable).toBe(false);
    expect(result.statut).toBe("rejete");
    expect(result.remede).toBeNull();
  });

  it("n'est pas rejetée à 23 mois depuis l'achat", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "non_conformite",
        date_achat: "2024-02-15",
        date_livraison: "2025-02-15",
      },
      TODAY,
    );
    expect(result.statut).not.toBe("rejete");
  });

  it("bascule la charge de la preuve au consommateur à exactement 12 mois depuis la livraison (Allemagne, présomption à 12 mois)", () => {
    const result = qualifier(
      {
        pays: "Allemagne",
        type_reclamation: "non_conformite",
        date_achat: "2024-02-15",
        date_livraison: "2025-01-15",
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.remede).toBe("Réparation ou remplacement");
  });

  it("présume le défaut antérieur (charge vendeur) à 11 mois depuis la livraison (Allemagne, présomption à 12 mois)", () => {
    const result = qualifier(
      {
        pays: "Allemagne",
        type_reclamation: "non_conformite",
        date_achat: "2024-02-15",
        date_livraison: "2025-02-15",
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.remede).toBe("Réparation, remplacement ou remboursement");
  });

  it("retombe sur la date d'achat quand la date de livraison est absente", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "non_conformite",
        date_achat: "2025-03-15",
        date_livraison: null,
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.remede).toBe("Réparation, remplacement ou remboursement");
  });

  it("à 15 mois depuis la livraison, la charge de la preuve diffère selon le pays (présomption 24 mois en France, 12 mois en Allemagne)", () => {
    const input = {
      type_reclamation: "non_conformite",
      date_achat: "2024-10-15",
      date_livraison: "2024-10-15",
    } as const;

    const france = qualifier({ ...input, pays: "France" }, TODAY);
    expect(france.recevable).toBe(true);
    expect(france.remede).toBe("Réparation, remplacement ou remboursement");

    const allemagne = qualifier({ ...input, pays: "Allemagne" }, TODAY);
    expect(allemagne.recevable).toBe(true);
    expect(allemagne.remede).toBe("Réparation ou remplacement");
  });
});

describe("qualifier — litige de livraison et erreur de facturation", () => {
  it("le litige de livraison est toujours recevable et passe en instruction", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "livraison",
        date_achat: "2026-01-01",
        date_livraison: "2026-01-05",
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.statut).toBe("instruction");
  });

  it("l'erreur de facturation est toujours recevable et passe en instruction", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "facturation",
        date_achat: "2026-01-01",
        date_livraison: null,
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.statut).toBe("instruction");
  });
});
