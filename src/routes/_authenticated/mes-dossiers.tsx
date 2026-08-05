import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/claimdesk/AppShell";
import { PaginationBar } from "@/components/claimdesk/PaginationBar";
import { StatutStamp } from "@/components/claimdesk/StatutStamp";
import { mesDossiers } from "@/lib/claims.functions";
import { LIBELLES_TYPE, type Statut } from "@/lib/qualification";

export const Route = createFileRoute("/_authenticated/mes-dossiers")({
  head: () => ({
    meta: [
      { title: "Mes dossiers — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content: "Suivez le statut d'avancement de vos réclamations OMNIVIA.",
      },
    ],
  }),
  component: MesDossiersPage,
});

const PAGE_SIZE = 10;
const ETAPES: Statut[] = ["cree", "qualifie", "instruction", "resolu"];

function Stepper({ statut }: { statut: Statut }) {
  const terminal = statut === "rejete" || statut === "escalade";
  const index = terminal ? -1 : ETAPES.indexOf(statut);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {ETAPES.map((etape, i) => (
        <span key={etape} className="flex items-center gap-2">
          <span
            className={
              i <= index
                ? "rounded-full bg-ink px-3 py-1 font-medium text-ink-foreground"
                : "rounded-full border border-border px-3 py-1 text-muted-foreground"
            }
          >
            {etape === "cree"
              ? "Créé"
              : etape === "qualifie"
                ? "Qualifié"
                : etape === "instruction"
                  ? "Instruction"
                  : "Résolu"}
          </span>
          {i < ETAPES.length - 1 ? <span className="text-border">—</span> : null}
        </span>
      ))}
      {terminal ? <StatutStamp statut={statut} /> : null}
    </div>
  );
}

function MesDossiersPage() {
  const fetchMine = useServerFn(mesDossiers);
  const [page, setPage] = useState(1);

  const result = useQuery({
    queryKey: ["mes-dossiers", page],
    queryFn: () => fetchMine({ data: { page, pageSize: PAGE_SIZE } }),
  });

  return (
    <AppShell
      title="Mes dossiers"
      subtitle="Suivez l'avancement de chacune de vos réclamations, du dépôt à la résolution."
    >
      <div className="sheet-panel p-6">
        {result.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : result.error ? (
          <p className="text-sm text-brick">{(result.error as Error).message}</p>
        ) : !result.data?.dossiers.length ? (
          <p className="text-sm text-muted-foreground">Aucun dossier déposé pour l'instant.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {result.data.dossiers.map((d) => (
                <li key={d.id} className="space-y-2 border-b border-border pb-4 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="dossier-num text-sm">{d.numero_dossier}</span>
                    <StatutStamp statut={d.statut} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {LIBELLES_TYPE[d.type_reclamation]} · {d.produit} · {d.pays}
                  </p>
                  <Stepper statut={d.statut} />
                  {d.motif_qualification ? (
                    <p className="text-xs text-muted-foreground">{d.motif_qualification}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <PaginationBar
              page={result.data.page}
              pageSize={result.data.pageSize}
              total={result.data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
