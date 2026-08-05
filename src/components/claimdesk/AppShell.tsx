import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DossierNav } from "./DossierNav";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { roles } = useRouteContext({ from: "/_authenticated" });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <DossierNav onSignOut={handleSignOut} roles={roles} />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 border-b border-border pb-5">
          <h1 className="text-3xl text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>
      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        OMNIVIA · ClaimDesk — qualification indicative fondée sur le droit européen de la
        consommation. Données traitées conformément au RGPD.
      </footer>
    </div>
  );
}
