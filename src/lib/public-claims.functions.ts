/**
 * Parcours public ClaimDesk : dépôt d'une réclamation sans compte et suivi par
 * code. Ces fonctions sont publiques (aucun bearer requis) — l'accès à un
 * dossier exige donc le couple code de suivi + adresse e-mail, vérifié côté
 * serveur, et seules les colonnes non sensibles sont renvoyées (jamais le
 * commentaire interne ni l'agent assigné).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { qualifier, PAYS_UE } from "./qualification";
import { verifierDates } from "./dates";
import { LANGUES } from "./i18n";
import { emailConfirmationDepot } from "./email-templates";
import { envoyerEmail } from "./notifications";

const depotPublicSchema = z
  .object({
    client_nom: z.string().trim().min(2).max(120),
    client_email: z.string().trim().email().max(255),
    pays: z.enum(PAYS_UE),
    langue: z.enum(LANGUES),
    produit: z.string().trim().min(2).max(160),
    type_reclamation: z.enum(["retractation", "non_conformite", "livraison", "facturation"]),
    description: z.string().trim().min(10).max(2000),
    date_achat: z.string().min(10).max(10),
    date_livraison: z.string().min(10).max(10).nullable().optional(),
    consentement_rgpd: z.literal(true),
  })
  .refine((d) => verifierDates(d) === null, {
    message: "Dates incohérentes : la livraison doit suivre l'achat et aucune date ne peut être future.",
    path: ["date_livraison"],
  });

export const deposerReclamationPublique = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => depotPublicSchema.parse(data))
  .handler(async ({ data }) => {
    const result = qualifier({
      pays: data.pays,
      type_reclamation: data.type_reclamation,
      date_achat: data.date_achat,
      date_livraison: data.date_livraison ?? null,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: claim, error } = await supabaseAdmin
      .from("claims")
      .insert({
        client_id: null,
        client_nom: data.client_nom,
        client_email: data.client_email.toLowerCase(),
        langue: data.langue,
        pays: data.pays,
        produit: data.produit,
        type_reclamation: data.type_reclamation,
        description: data.description,
        date_achat: data.date_achat,
        date_livraison: data.date_livraison ?? null,
        consentement_rgpd: true,
        statut: result.statut,
        recevable: result.recevable,
        motif_qualification: result.motif_qualification,
        remede: result.remede,
      })
      .select(
        "numero_dossier, code_suivi, statut, recevable, motif_qualification, remede, client_nom, type_reclamation",
      )
      .single();

    if (error) throw new Error(error.message);

    const template = emailConfirmationDepot({
      numero_dossier: claim.numero_dossier,
      client_nom: claim.client_nom,
      type_reclamation: claim.type_reclamation,
      statut: claim.statut,
      recevable: claim.recevable,
      motif_qualification: claim.motif_qualification,
      remede: claim.remede,
    });

    const blocCode =
      `<p style="margin:24px 0;padding:12px 16px;border:2px dashed #B08A3E;` +
      `font-family:monospace;font-size:16px;letter-spacing:0.1em;color:#12203A;">` +
      `Code de suivi : <strong>${claim.code_suivi}</strong></p>`;

    await envoyerEmail(data.client_email, {
      subject: template.subject,
      html: template.html.includes("</body>")
        ? template.html.replace("</body>", `${blocCode}</body>`)
        : template.html + blocCode,
      text: `${template.text}\n\nCode de suivi : ${claim.code_suivi}`,
    });

    return claim;
  });

const suiviSchema = z.object({
  code_suivi: z.string().trim().min(6).max(40),
  client_email: z.string().trim().email().max(255),
});

export const suivreDossierPublic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => suiviSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim, error } = await supabaseAdmin
      .from("claims")
      .select(
        "numero_dossier, code_suivi, statut, recevable, motif_qualification, remede, produit, type_reclamation, pays, date_creation, langue",
      )
      .eq("code_suivi", data.code_suivi.trim().toUpperCase())
      .eq("client_email", data.client_email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    return claim ?? null;
  });