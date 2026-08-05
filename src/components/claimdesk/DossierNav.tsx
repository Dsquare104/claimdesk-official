import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";

const onglets = [
  { to: "/portail", label: "Portail client", roles: ["client"] },
  { to: "/agent", label: "Traitement", roles: ["agent", "manager"] },
  { to: "/analytics", label: "Analytics", roles: ["manager"] },
  { to: "/equipe", label: "Équipe", roles: ["manager"] },
] as const;

export function DossierNav({
  onSignOut,
  roles = [],
}: {
  onSignOut?: () => void;
  roles?: readonly string[];
}) {
  const visibles = onglets.filter((o) => o.roles.some((r) => roles.includes(r)));

  return (
    <header className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 pt-5">
        <Link to="/" className="flex items-center gap-3">
          <Scale className="size-6 text-brass" aria-hidden />
          <span className="font-serif text-xl">
            ClaimDesk<span className="text-brass"> · </span>
            <span className="text-sm uppercase tracking-[0.2em] opacity-70">OMNIVIA</span>
          </span>
        </Link>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="rounded-md border border-brass/60 px-3 py-1.5 text-sm text-brass transition-colors hover:bg-brass/15"
          >
            Se déconnecter
          </button>
        ) : null}
      </div>
      {/* Onglets façon "chemise de dossier" */}
      <nav className="mx-auto mt-4 flex max-w-7xl gap-1 px-5">
        {visibles.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className="-mb-px rounded-t-lg border border-b-0 border-brass/25 px-4 py-2 text-sm font-medium text-ink-foreground/65 transition-colors hover:text-ink-foreground data-[status=active]:bg-background data-[status=active]:text-ink"
          >
            {o.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
