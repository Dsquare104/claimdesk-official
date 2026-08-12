import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, XCircle } from "lucide-react";
import { PublicShell } from "@/components/claimdesk/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deposerReclamationPublique } from "@/lib/public-claims.functions";
import { PAYS_UE, type Pays, type TypeReclamation } from "@/lib/qualification";
import { aujourdHuiISO, verifierDates } from "@/lib/dates";
import { LANGUE_PAR_PAYS, LIBELLES_TYPE_I18N, NOMS_PAYS } from "@/lib/i18n";
import { useLangue } from "@/lib/use-langue";

export const Route = createFileRoute("/reclamation")({
  head: () => ({
    meta: [
      { title: "Déposer une réclamation — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Déposez votre réclamation OMNIVIA sans créer de compte : qualification immédiate selon le droit européen et code de suivi unique.",
      },
      { property: "og:title", content: "Déposer une réclamation — ClaimDesk OMNIVIA" },
      {
        property: "og:description",
        content:
          "Formulaire de réclamation multilingue, qualification juridique immédiate et suivi par code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReclamationPage,
});

function ReclamationPage() {
  const navigate = useNavigate();
  const { langue, setLangue, t } = useLangue();
  const today = aujourdHuiISO();

  const [resultat, setResultat] = useState<{
    numero_dossier: string;
    code_suivi: string;
    recevable: boolean | null;
    motif_qualification: string | null;
    remede: string | null;
  } | null>(null);

  const [form, setForm] = useState({
    client_nom: "",
    client_email: "",
    pays: "France" as Pays,
    produit: "",
    type_reclamation: "retractation" as TypeReclamation,
    description: "",
    date_achat: "",
    date_livraison: "",
    consentement_rgpd: false,
  });

  // Le choix du pays bascule toute l'interface dans la langue de ce marché.
  function changerPays(pays: Pays) {
    setForm((f) => ({ ...f, pays }));
    setLangue(LANGUE_PAR_PAYS[pays]);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.consentement_rgpd) throw new Error(t("err.rgpd"));
      const erreur = verifierDates({
        date_achat: form.date_achat,
        date_livraison: form.date_livraison || null,
      });
      if (erreur === "dates") throw new Error(t("err.dates"));
      if (erreur === "futur") throw new Error(t("err.futur"));
      return deposerReclamationPublique({
        client_nom: form.client_nom,
        client_email: form.client_email,
        pays: form.pays,
        langue,
        produit: form.produit,
        type_reclamation: form.type_reclamation,
        description: form.description,
        date_achat: form.date_achat,
        date_livraison: form.date_livraison || null,
        consentement_rgpd: true,
      });
    },
    onSuccess: (claim) => {
      setResultat(claim);
      toast.success(`${claim.numero_dossier} · ${claim.code_suivi}`);
      setForm((f) => ({ ...f, produit: "", description: "", consentement_rgpd: false }));
    },
    onError: (e: Error) => toast.error(e.message || t("err.generique")),
  });

  return (
    <PublicShell
      langue={langue}
      onLangueChange={setLangue}
      title={t("form.title")}
      subtitle={t("form.subtitle")}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          className="sheet-panel space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">{t("form.nom")}</Label>
              <Input
                id="nom"
                required
                maxLength={120}
                value={form.client_nom}
                onChange={(e) => setForm({ ...form, client_nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("form.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("form.emailAide")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays">{t("form.pays")}</Label>
              <Select value={form.pays} onValueChange={(v) => changerPays(v as Pays)}>
                <SelectTrigger id="pays">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYS_UE.map((p) => (
                    <SelectItem key={p} value={p}>
                      {NOMS_PAYS[langue][p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="produit">{t("form.produit")}</Label>
              <Input
                id="produit"
                required
                maxLength={160}
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("form.type")}</Label>
              <Select
                value={form.type_reclamation}
                onValueChange={(v) => setForm({ ...form, type_reclamation: v as TypeReclamation })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIBELLES_TYPE_I18N[langue]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="achat">{t("form.dateAchat")}</Label>
              <Input
                id="achat"
                type="date"
                required
                max={form.date_livraison || today}
                value={form.date_achat}
                onChange={(e) => setForm({ ...form, date_achat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livraison">{t("form.dateLivraison")}</Label>
              <Input
                id="livraison"
                type="date"
                min={form.date_achat || undefined}
                max={today}
                value={form.date_livraison}
                onChange={(e) => setForm({ ...form, date_livraison: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("form.dateLivraisonAide")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea
              id="description"
              required
              rows={5}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-secondary/60 p-3 text-sm">
            <Checkbox
              checked={form.consentement_rgpd}
              onCheckedChange={(v) => setForm({ ...form, consentement_rgpd: v === true })}
            />
            <span className="text-muted-foreground">{t("form.rgpd")}</span>
          </label>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? t("form.submitting") : t("form.submit")}
          </Button>
        </form>

        {resultat ? (
          <div className="sheet-panel space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="dossier-num text-sm text-muted-foreground">
                {resultat.numero_dossier}
              </span>
              {resultat.recevable ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-forest">
                  <CheckCircle2 className="size-4" /> {t("result.recevable")}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm font-semibold text-brick">
                  <XCircle className="size-4" /> {t("result.nonRecevable")}
                </span>
              )}
            </div>
            <h2 className="text-lg">{t("result.title")}</h2>
            <p className="text-sm text-muted-foreground">{resultat.motif_qualification}</p>
            {resultat.remede ? (
              <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm">
                <strong className="font-semibold">{t("result.remede")} :</strong> {resultat.remede}
              </p>
            ) : null}

            <div className="space-y-2 rounded-md border-2 border-dashed border-brass p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("result.code")}
              </p>
              <p className="dossier-num text-xl text-foreground">{resultat.code_suivi}</p>
              <p className="text-xs text-muted-foreground">{t("result.codeAide")}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(resultat.code_suivi);
                    toast.success(t("result.copie"));
                  }}
                >
                  <Copy className="size-4" /> {t("result.copier")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    navigate({ to: "/suivi", search: { code: resultat.code_suivi } })
                  }
                >
                  {t("result.suivre")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}