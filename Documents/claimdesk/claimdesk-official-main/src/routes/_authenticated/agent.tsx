import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/claimdesk/AppShell";
import { StatutStamp } from "@/components/claimdesk/StatutStamp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  enregistrerCommentaire,
  majStatutDossier,
  tousLesDossiers,
} from "@/lib/claims.functions";
import {
  LIBELLES_STATUT,
  LIBELLES_TYPE,
  PAYS_UE,
  type Statut,
} from "@/lib/qualification";

export const Route = createFileRoute("/_authenticated/agent")({
  head: () => ({
    meta: [
      { title: "Traitement des dossiers — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Poste de travail agent : qualification, instruction, résolution et escalade des réclamations OMNIVIA.",
      },
      { property: "og:title", content: "Traitement des dossiers — ClaimDesk" },
      {
        property: "og:description",
        content: "Poste de travail agent pour l'instruction des réclamations clients.",
      },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  const fetchAll = useServerFn(tousLesDossiers);
  const setStatut = useServerFn(majStatutDossier);
  const saveComment = useServerFn(enregistrerCommentaire);
  const queryClient = useQueryClient();

  const [filtrePays, setFiltrePays] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreType, setFiltreType] = useState("tous");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const dossiers = useQuery({ queryKey: ["tous-dossiers"], queryFn: () => fetchAll() });

  const statutMutation = useMutation({
    mutationFn: (vars: { id: string; statut: Statut }) =>
      setStatut({ data: { id: vars.id, statut: vars.statut as never } }),
    onSuccess: (claim) => {
      toast.success(`${claim.numero_dossier} — ${LIBELLES_STATUT[claim.statut]}`);
      queryClient.invalidateQueries({ queryKey: ["tous-dossiers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commentMutation = useMutation({
    mutationFn: (vars: { id: string; commentaire_interne: string }) => saveComment({ data: vars }),
    onSuccess: () => {
      toast.success("Commentaire interne enregistré");
      queryClient.invalidateQueries({ queryKey: ["tous-dossiers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (dossiers.data ?? []).filter(
    (d) =>
      (filtrePays === "tous" || d.pays === filtrePays) &&
      (filtreStatut === "tous" || d.statut === filtreStatut) &&
      (filtreType === "tous" || d.type_reclamation === filtreType),
  );
  const selected = rows.find((d) => d.id === selectedId) ?? null;

  return (
    <AppShell
      title="Traitement des réclamations"
      subtitle="Consultez la qualification automatique de chaque dossier, puis faites-le avancer jusqu'à résolution ou escalade vers le médiateur de la consommation."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={filtrePays} onValueChange={setFiltrePays}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Pays" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les pays</SelectItem>
            {PAYS_UE.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreStatut} onValueChange={setFiltreStatut}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {Object.entries(LIBELLES_STATUT).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreType} onValueChange={setFiltreType}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les motifs</SelectItem>
            {Object.entries(LIBELLES_TYPE).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="sheet-panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dossier</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dossiers.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : dossiers.error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-brick">
                    {(dossiers.error as Error).message}
                  </TableCell>
                </TableRow>
              ) : !rows.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Aucun dossier ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((d) => (
                  <TableRow
                    key={d.id}
                    onClick={() => {
                      setSelectedId(d.id);
                      setCommentaire(d.commentaire_interne ?? "");
                    }}
                    className={
                      d.id === selectedId ? "cursor-pointer bg-brass/10" : "cursor-pointer"
                    }
                  >
                    <TableCell className="dossier-num text-xs">{d.numero_dossier}</TableCell>
                    <TableCell>{d.client_nom}</TableCell>
                    <TableCell>{d.pays}</TableCell>
                    <TableCell>{LIBELLES_TYPE[d.type_reclamation]}</TableCell>
                    <TableCell><StatutStamp statut={d.statut} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <aside className="sheet-panel h-fit p-6">
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un dossier pour afficher son détail et les actions de traitement.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="dossier-num text-sm">{selected.numero_dossier}</span>
                <StatutStamp statut={selected.statut} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Client</dt><dd>{selected.client_nom}</dd></div>
                <div><dt className="text-muted-foreground">Pays</dt><dd>{selected.pays}</dd></div>
                <div><dt className="text-muted-foreground">Produit</dt><dd>{selected.produit}</dd></div>
                <div><dt className="text-muted-foreground">Motif</dt><dd>{LIBELLES_TYPE[selected.type_reclamation]}</dd></div>
                <div><dt className="text-muted-foreground">Achat</dt><dd>{selected.date_achat}</dd></div>
                <div><dt className="text-muted-foreground">Livraison</dt><dd>{selected.date_livraison ?? "—"}</dd></div>
              </dl>

              <div className="rounded-md border border-border bg-secondary/50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Moteur de qualification
                </p>
                <p className={selected.recevable ? "text-sm font-semibold text-forest" : "text-sm font-semibold text-brick"}>
                  {selected.recevable ? "Recevable" : "Non recevable"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{selected.motif_qualification}</p>
                {selected.remede ? (
                  <p className="mt-2 text-sm"><strong>Remède :</strong> {selected.remede}</p>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Description :</strong> {selected.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={statutMutation.isPending}
                  onClick={() => statutMutation.mutate({ id: selected.id, statut: "instruction" })}
                >
                  Passer en instruction
                </Button>
                <Button
                  disabled={statutMutation.isPending}
                  onClick={() => statutMutation.mutate({ id: selected.id, statut: "resolu" })}
                >
                  Marquer résolu
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Escalader</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Escalader vers le médiateur ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Le dossier {selected.numero_dossier} sera transmis au médiateur de la
                        consommation. Cette action est visible par le client.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => statutMutation.mutate({ id: selected.id, statut: "escalade" })}
                      >
                        Confirmer l'escalade
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="comment">
                  Commentaire interne
                </label>
                <Textarea
                  id="comment"
                  rows={4}
                  maxLength={2000}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={commentMutation.isPending}
                  onClick={() =>
                    commentMutation.mutate({ id: selected.id, commentaire_interne: commentaire })
                  }
                >
                  Enregistrer le commentaire
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}