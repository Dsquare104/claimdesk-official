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

  it("reprend pour l'instant le socle harmonisé UE à l'identique pour tous les pays (placeholder en attente de validation juridique)", () => {
    for (const pays of PAYS_UE) {
      expect(REGLES_PAR_PAYS[pays]).toEqual({
        retractationDelaiJours: 14,
        nonConformiteGarantieMois: 24,
        nonConformitePresomptionMois: 12,
      });
    }
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

  it("applique les mêmes règles quel que soit le pays sélectionné (aucune variante encodée pour l'instant)", () => {
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

  it("bascule la charge de la preuve au consommateur à exactement 12 mois depuis la livraison", () => {
    const result = qualifier(
      {
        pays: "France",
        type_reclamation: "non_conformite",
        date_achat: "2024-02-15",
        date_livraison: "2025-01-15",
      },
      TODAY,
    );
    expect(result.recevable).toBe(true);
    expect(result.remede).toBe("Réparation ou remplacement");
  });

  it("présume le défaut antérieur (charge vendeur) à 11 mois depuis la livraison", () => {
    const result = qualifier(
      {
        pays: "France",
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
