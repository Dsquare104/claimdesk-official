import type { EmailTemplate } from "./email-templates";

/**
 * POINT D'EXTENSION (hors périmètre de ce MVP) : aucun fournisseur d'e-mail n'est
 * connecté — pas de clé API Resend/SendGrid/Postmark, pas de SMTP configuré. Cette
 * fonction journalise seulement le contenu généré ; à remplacer par un appel réel
 * une fois un fournisseur choisi et sa clé API ajoutée aux variables d'environnement
 * serveur (voir aussi les points d'extension Odoo/WebSocket dans claims.functions.ts).
 */
export async function envoyerEmail(
  destinataire: string | null | undefined,
  template: EmailTemplate,
): Promise<void> {
  if (!destinataire) {
    console.warn(
      "[notifications] Envoi ignoré : aucune adresse e-mail disponible pour ce destinataire.",
    );
    return;
  }
  console.log(
    `[notifications] (fournisseur non branché) "${template.subject}" prêt pour ${destinataire}.`,
  );
}
