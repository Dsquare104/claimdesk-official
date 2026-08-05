import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { AppShell } from "@/components/claimdesk/AppShell";
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
import { deposerReclamation } from "@/lib/claims.functions";
import { LIBELLES_TYPE, PAYS_UE, type TypeReclamation } from "@/lib/qualification";

export const Route = createFileRoute("/_authenticated/portail")({
  head: () => ({
    meta: [
      { title: "Portail client — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Déposez une réclamation OMNIVIA et suivez la qualification juridique de votre dossier en temps réel.",
      },
      { property: "og:title", content: "Portail client — ClaimDesk OMNIVIA" },
      {
        property: "og:description",
        content: "Dépôt et suivi de réclamation client selon le droit européen de la consommation.",
      },
    ],
  }),
  component: PortailPage,
});

function PortailPage() {
  const submit = useServerFn(deposerReclamation);
  const queryClient = useQueryClient();
  const [resultat, setResultat] = useState<{
    numero_dossier: string;
    recevable: boolean | null;
    motif_qualification: string | null;
    remede: string | null;
  } | null>(null);

  const [form, setForm] = useState({
    client_nom: "",
    pays: "France",
    produit: "",
    type_reclamation: "retractation" as TypeReclamation,
    description: "",
    date_achat: "",
    date_livraison: "",
    consentement_rgpd: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.consentement_rgpd) throw new Error("Le consentement RGPD est obligatoire.");
      return submit({
        data: {
          client_nom: form.client_nom,
          pays: form.pays as (typeof PAYS_UE)[number],
          produit: form.produit,
          type_reclamation: form.type_reclamation,
          description: form.description,
          date_achat: form.date_achat,
          date_livraison: form.date_livraison || null,
          consentement_rgpd: true,
        },
      });
    },
    onSuccess: (claim) => {
      setResultat(claim);
      toast.success(`Dossier ${claim.numero_dossier} enregistré`);
      setForm((f) => ({ ...f, produit: "", description: "", consentement_rgpd: false }));
      queryClient.invalidateQueries({ queryKey: ["mes-dossiers"] });
    },
    onError: (e: Error) => toast.error(e.message || "Le dépôt a échoué."),
  });

  return (
    <AppShell
      title="Déposer une réclamation"
      subtitle="Votre dossier est qualifié immédiatement au regard du droit européen de la consommation. La qualification affichée est indicative et peut être révisée en instruction."
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
              <Label htmlFor="nom">Nom du client</Label>
              <Input
                id="nom"
                required
                maxLength={120}
                value={form.client_nom}
                onChange={(e) => setForm({ ...form, client_nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pays de livraison</Label>
              <Select value={form.pays} onValueChange={(v) => setForm({ ...form, pays: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYS_UE.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="produit">Produit concerné</Label>
              <Input
                id="produit"
                required
                maxLength={160}
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de réclamation</Label>
              <Select
                value={form.type_reclamation}
                onValueChange={(v) => setForm({ ...form, type_reclamation: v as TypeReclamation })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIBELLES_TYPE).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="achat">Date d'achat</Label>
              <Input
                id="achat"
                type="date"
                required
                value={form.date_achat}
                onChange={(e) => setForm({ ...form, date_achat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livraison">Date de livraison</Label>
              <Input
                id="livraison"
                type="date"
                value={form.date_livraison}
                onChange={(e) => setForm({ ...form, date_livraison: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description des faits</Label>
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
            <span className="text-muted-foreground">
              J'autorise OMNIVIA à traiter les données de ce formulaire aux seules fins de
              l'instruction de ma réclamation (RGPD).
            </span>
          </label>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Qualification en cours…" : "Déposer et qualifier le dossier"}
          </Button>
        </form>

        <div className="space-y-6">
          {resultat ? (
            <div className="sheet-panel space-y-3 p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="dossier-num text-sm text-muted-foreground">
                  {resultat.numero_dossier}
                </span>
                {resultat.recevable ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-forest">
                    <CheckCircle2 className="size-4" /> Recevable
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-sm font-semibold text-brick">
                    <XCircle className="size-4" /> Non recevable
                  </span>
                )}
              </div>
              <h2 className="text-lg">Résultat de la qualification</h2>
              <p className="text-sm text-muted-foreground">{resultat.motif_qualification}</p>
              {resultat.remede ? (
                <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm">
                  <strong className="font-semibold">Remède applicable :</strong> {resultat.remede}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="sheet-panel space-y-3 p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <FileText className="size-4 text-brass" /> Suivre mes dossiers
            </h2>
            <p className="text-sm text-muted-foreground">
              Retrouvez la liste de toutes vos réclamations et leur statut d'avancement.
            </p>
            <Link
              to="/mes-dossiers"
              className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              Voir mes dossiers
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
