import { describe, expect, it } from "vitest";
import {
  emailChangementStatut,
  emailConfirmationDepot,
  type DossierEmailInfo,
} from "./email-templates";

const DOSSIER: DossierEmailInfo = {
  numero_dossier: "CD-2026-1042",
  client_nom: "Camille Dupont",
  type_reclamation: "retractation",
  statut: "qualifie",
  recevable: true,
  motif_qualification: "Rétractation exercée dans le délai légal.",
  remede: "Remboursement intégral",
};

describe("emailConfirmationDepot", () => {
  it("inclut le numéro de dossier dans le sujet, le HTML et le texte", () => {
    const email = emailConfirmationDepot(DOSSIER);
    expect(email.subject).toContain("CD-2026-1042");
    expect(email.html).toContain("CD-2026-1042");
    expect(email.text).toContain("CD-2026-1042");
  });

  it("inclut le nom du client et le remède", () => {
    const email = emailConfirmationDepot(DOSSIER);
    expect(email.html).toContain("Camille Dupont");
    expect(email.html).toContain("Remboursement intégral");
    expect(email.text).toContain("Camille Dupont");
    expect(email.text).toContain("Remboursement intégral");
  });

  it("omet la ligne remède quand il n'y en a pas (dossier rejeté)", () => {
    const email = emailConfirmationDepot({ ...DOSSIER, statut: "rejete", remede: null });
    expect(email.html).not.toContain("Remède envisagé");
    expect(email.text).not.toContain("Remède envisagé");
  });

  it("produit un document HTML valide (doctype présent)", () => {
    const email = emailConfirmationDepot(DOSSIER);
    expect(email.html.trim().startsWith("<!doctype html>")).toBe(true);
  });

  it("déclare l'encodage UTF-8 (sans quoi les accents s'affichent mal dans les clients mail)", () => {
    const email = emailConfirmationDepot(DOSSIER);
    expect(email.html).toContain('<meta charset="utf-8"');
  });
});

describe("emailChangementStatut", () => {
  it("mentionne l'ancien et le nouveau statut", () => {
    const email = emailChangementStatut({ ...DOSSIER, statut: "resolu" }, "instruction");
    expect(email.text).toContain("Instruction");
    expect(email.text).toContain("Résolu");
    expect(email.html).toContain("Instruction");
    expect(email.html).toContain("Résolu");
  });

  it("le sujet reflète le nouveau statut", () => {
    const email = emailChangementStatut({ ...DOSSIER, statut: "escalade" }, "instruction");
    expect(email.subject).toContain("Escaladé");
  });
});
