import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, ShieldCheck, Stamp, Gavel } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClaimDesk — Gestion des réclamations OMNIVIA" },
      {
        name: "description",
        content:
          "ClaimDesk qualifie chaque réclamation client selon le droit européen de la consommation et la suit jusqu'à résolution, sur les 7 marchés d'OMNIVIA.",
      },
      { property: "og:title", content: "ClaimDesk — Gestion des réclamations OMNIVIA" },
      {
        property: "og:description",
        content:
          "Qualification juridique automatisée et traitement des réclamations clients en Europe.",
      },
    ],
  }),
  component: Index,
});

const piliers = [
  {
    icon: Gavel,
    titre: "Qualification juridique",
    texte:
      "Rétractation, non-conformité, livraison, facturation : chaque dossier est confronté aux délais légaux européens dès son dépôt.",
  },
  {
    icon: Stamp,
    titre: "Traçabilité par tampon",
    texte:
      "Créé, qualifié, en instruction, résolu, escaladé : le statut de chaque dossier est apposé comme un tampon officiel.",
  },
  {
    icon: ShieldCheck,
    titre: "Conformité RGPD",
    texte:
      "Consentement recueilli au dépôt, données limitées au strict nécessaire à l'instruction du dossier.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="flex items-center gap-3">
            <Scale className="size-6 text-brass" aria-hidden />
            <span className="font-serif text-xl">
              ClaimDesk{" "}
              <span className="text-sm uppercase tracking-[0.2em] opacity-70">OMNIVIA</span>
            </span>
          </span>
          <Link
            to="/auth"
            className="rounded-md border border-brass/60 px-4 py-2 text-sm text-brass transition-colors hover:bg-brass/15"
          >
            Accéder au module
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-14">
        
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Avez-vous une réclamation ? Nous sommes à l’écoute.
          </h1>
          <p className="mt-6 max-w-2xl text-ink-foreground/75">
            Nous traitons vos demandes dans de brefs délais. Vous pouvez suivre votre dossier avec votre code unique.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/reclamation"
              className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-brass-foreground transition-opacity hover:opacity-90"
            >
              Déposer une réclamation
            </Link>
            <Link
              to="/suivi"
              className="rounded-md border border-brass/50 px-5 py-2.5 text-sm font-medium text-brass transition-colors hover:bg-brass/15"
            >
              Suivre ma demande 
            </Link>
            <Link
              to="/auth"
              className="rounded-md border border-ink-foreground/30 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink-foreground/10"
            >
              Espace agent & management
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {piliers.map((p) => (
            <section key={p.titre} className="sheet-panel p-6">
              <p.icon className="size-5 text-brass" aria-hidden />
              <h2 className="mt-4 text-lg">{p.titre}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.texte}</p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        OMNIVIA · ClaimDesk — qualification indicative fondée sur les directives 2011/83/UE et (UE)
        2019/771.
      </footer>
    </div>
  );
}
