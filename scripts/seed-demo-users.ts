// Script de démo/test — crée des comptes ClaimDesk via l'API publique Supabase (signUp).
// Ne pas utiliser en production : mot de passe fixe, adresses factices.
//
// Usage : bun run scripts/seed-demo-users.ts
//
// Tous les comptes sont créés avec le rôle "client" par défaut (correctif de la faille
// d'auto-attribution de rôle à l'inscription). Le SQL à coller dans l'éditeur Lovable
// pour confirmer ces comptes et attribuer les rôles agent/manager est imprimé à la fin
// (et se trouve aussi, prêt à l'emploi, dans supabase/seed-roles.sql).

import { supabase } from "@/integrations/supabase/client";

const DEMO_USERS = [
  {
    email: "client1.demo@claimdesk.test",
    password: "Cl4imD3sk-D3mo_2026!",
    nom: "Camille Dupont",
    role: "client",
  },
  {
    email: "client2.demo@claimdesk.test",
    password: "Cl4imD3sk-D3mo_2026!",
    nom: "Marta Kowalczyk",
    role: "client",
  },
  {
    email: "agent.demo@claimdesk.test",
    password: "Cl4imD3sk-D3mo_2026!",
    nom: "Yassine Haddad",
    role: "agent",
  },
  {
    email: "manager.demo@claimdesk.test",
    password: "Cl4imD3sk-D3mo_2026!",
    nom: "Elena Rossi",
    role: "manager",
  },
] as const;

async function main() {
  for (const u of DEMO_USERS) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { nom: u.nom, consentement_rgpd: true } },
    });
    if (error) {
      console.error(`✗ ${u.email} : ${error.message}`);
      continue;
    }
    console.log(`✓ ${u.email} créé (id: ${data.user?.id ?? "?"})`);
  }

  console.log("\nTous les comptes ci-dessus ont le rôle 'client' par défaut.");
  console.log(
    "Colle le contenu de supabase/seed-roles.sql dans l'éditeur SQL Lovable pour :\n" +
      "  - confirmer ces comptes (adresses factices, jamais de lien de confirmation reçu)\n" +
      "  - attribuer les rôles agent/manager aux comptes concernés\n",
  );
}

main();
