import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/claimdesk/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dossiersAnalytics } from "@/lib/claims.functions";
import { LIBELLES_TYPE, PAYS_UE, type TypeReclamation } from "@/lib/qualification";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics réclamations — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Pilotage management : taux de résolution, délai moyen de traitement et répartition des réclamations par pays et par motif.",
      },
      { property: "og:title", content: "Analytics réclamations — ClaimDesk" },
      {
        property: "og:description",
        content: "KPI de traitement des réclamations OMNIVIA sur 7 marchés européens.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PERIODES = [
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "90 derniers jours" },
  { value: "365", label: "12 derniers mois" },
  { value: "tout", label: "Depuis l'origine" },
];

const COLORS = [
  "var(--color-ink)",
  "var(--color-brass)",
  "var(--color-forest)",
  "var(--color-brick)",
];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="sheet-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AnalyticsPage() {
  const fetchData = useServerFn(dossiersAnalytics);
  const [periode, setPeriode] = useState("90");
  const [pays, setPays] = useState("tous");

  const query = useQuery({ queryKey: ["analytics"], queryFn: () => fetchData() });

  if (query.error) {
    return (
      <AppShell title="Analytics">
        <p className="sheet-panel p-6 text-sm text-brick">{(query.error as Error).message}</p>
      </AppShell>
    );
  }

  const all = query.data ?? [];
  const limite =
    periode === "tout" ? 0 : Date.now() - Number(periode) * 86_400_000;
  const rows = all.filter(
    (d) =>
      (pays === "tous" || d.pays === pays) &&
      (limite === 0 || new Date(d.date_creation).getTime() >= limite),
  );

  const enCours = rows.filter((d) =>
    ["cree", "qualifie", "instruction", "escalade"].includes(d.statut),
  ).length;
  const resolus = rows.filter((d) => d.statut === "resolu");
  const premierContact = rows.filter(
    (d) => d.recevable === true && (d.statut === "resolu" || d.statut === "qualifie"),
  ).length;
  const tauxPremierContact = rows.length
    ? Math.round((premierContact / rows.length) * 100)
    : 0;
  const tempsMoyen = resolus.length
    ? (
        resolus.reduce((s, d) => s + (d.temps_traitement_jours ?? 0), 0) / resolus.length
      ).toFixed(1)
    : "—";

  const parPays = PAYS_UE.map((p) => ({
    pays: p,
    dossiers: rows.filter((d) => d.pays === p).length,
  }));

  const parMotif = (Object.keys(LIBELLES_TYPE) as TypeReclamation[])
    .map((t) => ({
      name: LIBELLES_TYPE[t],
      value: rows.filter((d) => d.type_reclamation === t).length,
    }))
    .filter((d) => d.value > 0);

  return (
    <AppShell
      title="Pilotage des réclamations"
      subtitle="Indicateurs consolidés sur les 7 marchés européens d'OMNIVIA."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pays} onValueChange={setPays}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les pays</SelectItem>
            {PAYS_UE.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Résolution 1er contact"
          value={`${tauxPremierContact} %`}
          hint="Dossiers recevables tranchés sans instruction complémentaire"
        />
        <Kpi label="Délai moyen" value={`${tempsMoyen} j`} hint="Sur les dossiers résolus" />
        <Kpi label="Dossiers en cours" value={String(enCours)} />
        <Kpi label="Total dossiers" value={String(rows.length)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="sheet-panel p-6">
          <h2 className="mb-4 text-lg">Dossiers par pays</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parPays}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="pays" tick={{ fontSize: 11 }} interval={0} angle={-20} dy={10} height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="dossiers" fill="var(--color-ink)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sheet-panel p-6">
          <h2 className="mb-4 text-lg">Répartition par motif</h2>
          <div className="h-72">
            {parMotif.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={parMotif} dataKey="value" nameKey="name" outerRadius={95} label>
                    {parMotif.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}