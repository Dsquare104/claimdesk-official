import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { PublicShell } from "@/components/claimdesk/PublicShell";
import { StatutStamp } from "@/components/claimdesk/StatutStamp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suivreDossierPublic } from "@/lib/public-claims.functions";
import { LIBELLES_STATUT_I18N, LIBELLES_TYPE_I18N, NOMS_PAYS } from "@/lib/i18n";
import { useLangue } from "@/lib/use-langue";
import type { Pays, Statut, TypeReclamation } from "@/lib/qualification";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/suivi")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Suivre ma réclamation — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Suivez l'état de votre réclamation OMNIVIA avec votre code de suivi et votre adresse e-mail, sans créer de compte.",
      },
      { property: "og:title", content: "Suivre ma réclamation — ClaimDesk OMNIVIA" },
      {
        property: "og:description",
        content: "Consultation de l'avancement d'un dossier de réclamation par code de suivi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuiviPage,
});

function SuiviPage() {
  const { code } = Route.useSearch();
  const rechercher = useServerFn(suivreDossierPublic);
  const { langue, setLangue, t } = useLangue();

  const [codeSuivi, setCodeSuivi] = useState(code ?? "");
  const [email, setEmail] = useState("");
  const [introuvable, setIntrouvable] = useState(false);

  const mutation = useMutation({
    mutationFn: () => rechercher({ data: { code_suivi: codeSuivi, client_email: email } }),
    onSuccess: (dossier) => setIntrouvable(dossier === null),
  });

  const dossier = mutation.data ?? null;

  return (
    <PublicShell
      langue={langue}
      onLangueChange={setLangue}
      title={t("suivi.title")}
      subtitle={t("suivi.subtitle")}
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="sheet-panel space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setIntrouvable(false);
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">{t("suivi.code")}</Label>
            <Input
              id="code"
              required
              className="dossier-num uppercase"
              placeholder="SUIVI-XXXXXXXX"
              value={codeSuivi}
              onChange={(e) => setCodeSuivi(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("suivi.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("suivi.submitting") : t("suivi.submit")}
          </Button>
          {introuvable ? (
            <p className="text-sm text-brick">{t("suivi.introuvable")}</p>
          ) : null}
        </form>

        {dossier ? (
          <div className="sheet-panel space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="dossier-num text-sm text-muted-foreground">
                {t("suivi.dossier")} {dossier.numero_dossier}
              </span>
              <StatutStamp statut={dossier.statut as Statut} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("suivi.produit")}</dt>
                <dd>{dossier.produit}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("suivi.type")}</dt>
                <dd>{LIBELLES_TYPE_I18N[langue][dossier.type_reclamation as TypeReclamation]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("form.pays")}</dt>
                <dd>{NOMS_PAYS[langue][dossier.pays as Pays]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("suivi.depose")}</dt>
                <dd>{new Date(dossier.date_creation).toLocaleDateString(langue)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">{t("suivi.statut")}</dt>
                <dd>{LIBELLES_STATUT_I18N[langue][dossier.statut as Statut]}</dd>
              </div>
            </dl>
            {dossier.motif_qualification ? (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {t("suivi.motif")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dossier.motif_qualification}
                </p>
              </div>
            ) : null}
            {dossier.remede ? (
              <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm">
                <strong className="font-semibold">{t("suivi.remede")} :</strong> {dossier.remede}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}