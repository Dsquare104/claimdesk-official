/**
 * Parcours public ClaimDesk : dépôt d'une réclamation sans compte et suivi par
 * code. Ces fonctions sont publiques (aucun bearer requis) — l'accès à un
 * dossier exige donc le couple code de suivi + adresse e-mail, vérifié côté
 * backend, et seules les colonnes non sensibles sont renvoyées (jamais le
 * commentaire interne ni l'agent assigné).
 */

import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PAYS_UE } from "./qualification";
import { verifierDates } from "./dates";
import { LANGUES } from "./i18n";

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

export async function deposerReclamationPublique(input: unknown) {
  const data = depotPublicSchema.parse(input);
  const { data: claims, error } = await supabase.rpc("deposer_reclamation_publique", {
    _client_nom: data.client_nom,
    _client_email: data.client_email,
    _pays: data.pays,
    _langue: data.langue,
    _produit: data.produit,
    _type_reclamation: data.type_reclamation,
    _description: data.description,
    _date_achat: data.date_achat,
    _date_livraison: (data.date_livraison ?? null) as unknown as string,
    _consentement_rgpd: true,
  });
  if (error) throw new Error(error.message);
  const claim = claims?.[0];
  if (!claim) throw new Error("Le dossier n'a pas pu être créé.");
  return claim;
}

const suiviSchema = z.object({
  code_suivi: z.string().trim().min(6).max(40),
  client_email: z.string().trim().email().max(255),
});

export async function suivreDossierPublic(input: unknown) {
  const data = suiviSchema.parse(input);
  const { data: claims, error } = await supabase.rpc("suivre_dossier_public", {
    _code_suivi: data.code_suivi.trim().toUpperCase(),
    _client_email: data.client_email.trim().toLowerCase(),
  });
  if (error) throw new Error(error.message);
  return claims?.[0] ?? null;
}