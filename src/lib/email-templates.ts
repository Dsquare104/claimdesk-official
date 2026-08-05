/**
 * Templates d'e-mail client ClaimDesk — fonctions pures, sans I/O, générant le
 * contenu (sujet + HTML + texte) des notifications envoyées au client. Reprend
 * l'identité visuelle « dossier officiel » de l'app (encre marine, papier grisé,
 * laiton, vert forêt, brique — cf. src/styles.css) en CSS inline, requis pour un
 * rendu fiable dans les clients de messagerie.
 *
 * L'envoi effectif est un point d'extension séparé (voir src/lib/notifications.ts) :
 * aucun fournisseur d'e-mail n'est connecté à ce stade.
 */

import { LIBELLES_STATUT, LIBELLES_TYPE, type Statut, type TypeReclamation } from "./qualification";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface DossierEmailInfo {
  numero_dossier: string;
  client_nom: string;
  type_reclamation: TypeReclamation;
  statut: Statut;
  recevable: boolean | null;
  motif_qualification: string | null;
  remede: string | null;
}

const COULEURS = {
  encre: "#12203A",
  encreTexte: "#F5F4EC",
  papier: "#EEEEE4",
  laiton: "#B08A3E",
  foret: "#3E6355",
  brique: "#B0472B",
};

function couleurStatut(statut: Statut): string {
  if (statut === "resolu") return COULEURS.foret;
  if (statut === "rejete" || statut === "escalade") return COULEURS.brique;
  return COULEURS.laiton;
}

function badgeStatut(statut: Statut): string {
  const couleur = couleurStatut(statut);
  return (
    `<span style="display:inline-block;padding:4px 12px;border:2px dashed ${couleur};` +
    `border-radius:999px;color:${couleur};font-size:11px;font-weight:bold;` +
    `text-transform:uppercase;letter-spacing:0.08em;">${LIBELLES_STATUT[statut]}</span>`
  );
}

function enveloppe(corpsHtml: string): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${COULEURS.papier};font-family:Georgia,'Times New Roman',serif;color:${COULEURS.encre};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COULEURS.papier};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${COULEURS.encre};color:${COULEURS.encreTexte};padding:20px 28px;">
                <span style="font-size:20px;letter-spacing:0.02em;">ClaimDesk <span style="color:${COULEURS.laiton};">&middot;</span> <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.2em;opacity:0.75;">OMNIVIA</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;">
                ${corpsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #e5e3d8;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b6b63;">
                OMNIVIA &middot; ClaimDesk — qualification indicative fondée sur le droit européen de la consommation. Données traitées conformément au RGPD.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailConfirmationDepot(dossier: DossierEmailInfo): EmailTemplate {
  const subject = `ClaimDesk — Dossier ${dossier.numero_dossier} reçu`;

  const html = enveloppe(`
    <p>Bonjour ${dossier.client_nom},</p>
    <p>Votre réclamation a bien été enregistrée sous le numéro
      <strong style="font-family:'Courier New',Courier,monospace;">${dossier.numero_dossier}</strong>
      (${LIBELLES_TYPE[dossier.type_reclamation]}).</p>
    <p>${badgeStatut(dossier.statut)}</p>
    ${dossier.motif_qualification ? `<p style="color:#333333;">${dossier.motif_qualification}</p>` : ""}
    ${dossier.remede ? `<p><strong>Remède envisagé :</strong> ${dossier.remede}</p>` : ""}
    <p>Vous pouvez suivre l'avancement de ce dossier depuis votre espace ClaimDesk, onglet
      « Portail client ».</p>
  `);

  const text = [
    `Bonjour ${dossier.client_nom},`,
    "",
    `Votre réclamation a bien été enregistrée sous le numéro ${dossier.numero_dossier} (${LIBELLES_TYPE[dossier.type_reclamation]}).`,
    `Statut : ${LIBELLES_STATUT[dossier.statut]}`,
    dossier.motif_qualification ?? "",
    dossier.remede ? `Remède envisagé : ${dossier.remede}` : "",
    "",
    "Suivez ce dossier depuis votre espace ClaimDesk, onglet « Portail client ».",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

export function emailChangementStatut(
  dossier: DossierEmailInfo,
  statutPrecedent: Statut,
): EmailTemplate {
  const subject = `ClaimDesk — Dossier ${dossier.numero_dossier} : ${LIBELLES_STATUT[dossier.statut]}`;

  const html = enveloppe(`
    <p>Bonjour ${dossier.client_nom},</p>
    <p>Le statut de votre dossier
      <strong style="font-family:'Courier New',Courier,monospace;">${dossier.numero_dossier}</strong>
      a évolué :</p>
    <p>${badgeStatut(statutPrecedent)} &rarr; ${badgeStatut(dossier.statut)}</p>
    ${dossier.remede ? `<p><strong>Remède :</strong> ${dossier.remede}</p>` : ""}
    <p>Consultez le détail depuis votre espace ClaimDesk, onglet « Portail client ».</p>
  `);

  const text = [
    `Bonjour ${dossier.client_nom},`,
    "",
    `Le statut de votre dossier ${dossier.numero_dossier} est passé de ${LIBELLES_STATUT[statutPrecedent]} à ${LIBELLES_STATUT[dossier.statut]}.`,
    dossier.remede ? `Remède : ${dossier.remede}` : "",
    "",
    "Consultez le détail depuis votre espace ClaimDesk, onglet « Portail client ».",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
