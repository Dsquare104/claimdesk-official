import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { emailChangementStatut, emailConfirmationDepot } from "./email-templates";
import { envoyerEmail } from "./notifications";
import { qualifier, PAYS_UE } from "./qualification";
import { verifierDates } from "./dates";

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
 *    stockées ; `consentement_rgpd` est obligatoire au dépôt. La purge des
 *    dossiers résolus depuis plus de 3 ans est disponible (`purgerDossiersResolus`
 *    ci-dessous, déclenchement manuel manager sur /equipe) ; automatiser son
 *    déclenchement (ex. pg_cron) reste hors périmètre de ce MVP.
 */

const createSchema = z
  .object({
    client_nom: z.string().trim().min(2).max(120),
    pays: z.enum(PAYS_UE),
    produit: z.string().trim().min(2).max(160),
    type_reclamation: z.enum(["retractation", "non_conformite", "livraison", "facturation"]),
    description: z.string().trim().min(10).max(2000),
    date_achat: z.string().min(10),
    date_livraison: z.string().min(10).nullable().optional(),
    consentement_rgpd: z.literal(true),
  })
  .refine((d) => verifierDates(d) === null, {
    message:
      "Dates incohérentes : la date de livraison doit suivre la date d'achat et aucune date ne peut être future.",
    path: ["date_livraison"],
  });

export const deposerReclamation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const result = qualifier({
      pays: data.pays,
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

    await envoyerEmail(
      context.claims.email,
      emailConfirmationDepot({
        numero_dossier: claim.numero_dossier,
        client_nom: claim.client_nom,
        type_reclamation: claim.type_reclamation,
        statut: claim.statut,
        recevable: claim.recevable,
        motif_qualification: claim.motif_qualification,
        remede: claim.remede,
      }),
    );

    return claim;
  });

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export const mesDossiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paginationSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const {
      data: dossiers,
      error,
      count,
    } = await context.supabase
      .from("claims")
      .select("*", { count: "exact" })
      .eq("client_id", context.userId)
      .order("date_creation", { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return {
      dossiers: dossiers ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
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

async function assertStaff(context: { supabase: SupabaseClient<Database>; userId: string }) {
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

const dossiersQuerySchema = paginationSchema.extend({
  pays: z.enum(PAYS_UE).optional(),
  statut: z.enum(["cree", "qualifie", "rejete", "instruction", "resolu", "escalade"]).optional(),
  type_reclamation: z
    .enum(["retractation", "non_conformite", "livraison", "facturation"])
    .optional(),
});

export const tousLesDossiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => dossiersQuerySchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let query = context.supabase
      .from("claims")
      .select("*", { count: "exact" })
      .order("date_creation", { ascending: false });
    if (data.pays) query = query.eq("pays", data.pays);
    if (data.statut) query = query.eq("statut", data.statut);
    if (data.type_reclamation) query = query.eq("type_reclamation", data.type_reclamation);

    const { data: dossiers, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);
    return {
      dossiers: dossiers ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
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
      .select("date_creation, statut")
      .eq("id", data.id)
      .single();
    if (readError) throw new Error(readError.message);

    const statutPrecedent = existing.statut;
    const created = new Date(existing.date_creation).getTime();
    const patch =
      data.statut === "resolu"
        ? {
            statut: data.statut,
            agent_assigne_id: context.userId,
            date_resolution: new Date().toISOString(),
            temps_traitement_jours: Math.max(0, Math.round((Date.now() - created) / 86_400_000)),
          }
        : { statut: data.statut, agent_assigne_id: context.userId };

    const { data: claim, error } = await context.supabase
      .from("claims")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    // TODO (extension Odoo) : émettre ici le webhook de mise à jour de statut.

    if (statutPrecedent !== claim.statut) {
      let destinataire: string | null = claim.client_email ?? null;
      if (!destinataire && claim.client_id) {
        const { data: profile } = await context.supabase
          .from("profiles")
          .select("email")
          .eq("id", claim.client_id)
          .maybeSingle();
        destinataire = profile?.email ?? null;
      }

      await envoyerEmail(
        destinataire,
        emailChangementStatut(
          {
            numero_dossier: claim.numero_dossier,
            client_nom: claim.client_nom,
            type_reclamation: claim.type_reclamation,
            statut: claim.statut,
            recevable: claim.recevable,
            motif_qualification: claim.motif_qualification,
            remede: claim.remede,
          },
          statutPrecedent,
        ),
      );
    }

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

const attribuerRoleSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["agent", "manager"]),
});

export const attribuerRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => attribuerRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    if (!roles.includes("manager")) {
      throw new Error("L'attribution de rôle est réservée au management.");
    }
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error(`Aucun compte trouvé pour ${data.email}.`);

    const { error } = await context.supabase
      .from("user_roles")
      .upsert({ user_id: profile.id, role: data.role }, { onConflict: "user_id,role" });
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

const RETENTION_DOSSIERS_RESOLUS_ANS = 3;

export const purgerDossiersResolus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertStaff(context);
    if (!roles.includes("manager")) {
      throw new Error("La purge RGPD est réservée au management.");
    }

    const seuil = new Date();
    seuil.setFullYear(seuil.getFullYear() - RETENTION_DOSSIERS_RESOLUS_ANS);

    const { data, error: purgeError } = await context.supabase
      .from("claims")
      .delete()
      .eq("statut", "resolu")
      .lt("date_resolution", seuil.toISOString())
      .select("id");
    if (purgeError) throw new Error(purgeError.message);
    return { supprimes: data?.length ?? 0 };
  });
