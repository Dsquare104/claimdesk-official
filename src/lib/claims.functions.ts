import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { qualifier, PAYS_UE } from "./qualification";

/**
 * POINTS D'EXTENSION PRÉVUS (hors périmètre de ce MVP) :
 *
 * 1. Synchronisation ERP Odoo — exposer `GET /api/public/claims` et
 *    `POST /api/public/claims` (routes serveur TanStack sous src/routes/api/public/),
 *    plus un webhook sortant `POST <odoo>/claimdesk/status` déclenché par
 *    `majStatutDossier` ci-dessous pour propager les changements de statut.
 * 2. Canal WebSocket / Realtime — activer la réplication temps réel sur la table
 *    `claims` et souscrire côté client au canal `claims:client_id=eq.<uid>` pour
 *    rafraîchir le stepper de statut sans rechargement.
 * 3. RGPD — seules les données strictement nécessaires au traitement sont
 *    stockées ; `consentement_rgpd` est obligatoire au dépôt et une purge
 *    automatique des dossiers résolus (> 3 ans) devra être planifiée.
 */

const createSchema = z.object({
  client_nom: z.string().trim().min(2).max(120),
  pays: z.enum(PAYS_UE),
  produit: z.string().trim().min(2).max(160),
  type_reclamation: z.enum([
    "retractation",
    "non_conformite",
    "livraison",
    "facturation",
  ]),
  description: z.string().trim().min(10).max(2000),
  date_achat: z.string().min(10),
  date_livraison: z.string().min(10).nullable().optional(),
  consentement_rgpd: z.literal(true),
});

export const deposerReclamation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const result = qualifier({
      type_reclamation: data.type_reclamation,
      date_achat: data.date_achat,
      date_livraison: data.date_livraison ?? null,
    });

    const { data: claim, error } = await context.supabase
      .from("claims")
      .insert({
        client_id: context.userId,
        client_nom: data.client_nom,
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
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return claim;
  });

export const mesDossiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("claims")
      .select("*")
      .eq("client_id", context.userId)
      .order("date_creation", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const monProfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    return {
      userId: context.userId,
      nom: profile?.nom ?? "",
      roles: (roles ?? []).map((r) => r.role),
    };
  });

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const roles: string[] = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("agent") && !roles.includes("manager")) {
    throw new Error("Accès réservé aux agents et managers.");
  }
  return roles;
}

export const tousLesDossiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("claims")
      .select("*")
      .order("date_creation", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

const majSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["qualifie", "instruction", "resolu", "escalade", "rejete"]),
});

export const majStatutDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => majSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    const { data: existing, error: readError } = await context.supabase
      .from("claims")
      .select("date_creation")
      .eq("id", data.id)
      .single();
    if (readError) throw new Error(readError.message);

    const patch: Record<string, unknown> = {
      statut: data.statut,
      agent_assigne_id: context.userId,
    };

    if (data.statut === "resolu") {
      const created = new Date(existing.date_creation).getTime();
      patch['date_resolution'] = new Date().toISOString();
      patch['temps_traitement_jours'] = Math.max(
        0,
        Math.round((Date.now() - created) / 86_400_000),
      );
    }

    const { data: claim, error } = await context.supabase
      .from("claims")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    // TODO (extension Odoo) : émettre ici le webhook de mise à jour de statut.
    return claim;
  });

const commentaireSchema = z.object({
  id: z.string().uuid(),
  commentaire_interne: z.string().trim().max(2000),
});

export const enregistrerCommentaire = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => commentaireSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("claims")
      .update({ commentaire_interne: data.commentaire_interne })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const dossiersAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertStaff(context);
    if (!roles.includes("manager")) {
      throw new Error("Tableau de bord analytique réservé au management.");
    }
    const { data, error } = await context.supabase
      .from("claims")
      .select(
        "id, pays, type_reclamation, statut, recevable, temps_traitement_jours, date_creation",
      )
      .order("date_creation", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });