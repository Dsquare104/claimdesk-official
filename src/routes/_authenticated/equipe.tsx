import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/claimdesk/AppShell";
import { GestionRoles } from "@/components/claimdesk/GestionRoles";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content: "Attribution des rôles agent et management aux comptes ClaimDesk.",
      },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  return (
    <AppShell
      title="Équipe"
      subtitle="Attribuez les rôles agent et management aux comptes déjà créés."
    >
      <GestionRoles />
    </AppShell>
  );
}
