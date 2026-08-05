import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/claimdesk/AppShell";
import { GestionRoles } from "@/components/claimdesk/GestionRoles";
import { PurgeRgpd } from "@/components/claimdesk/PurgeRgpd";

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
      <div className="space-y-8">
        <GestionRoles />
        <PurgeRgpd />
      </div>
    </AppShell>
  );
}
