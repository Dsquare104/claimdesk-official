import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — ClaimDesk OMNIVIA" },
      {
        name: "description",
        content:
          "Accédez à ClaimDesk : espace client, poste de traitement agent ou pilotage management des réclamations OMNIVIA.",
      },
      { property: "og:title", content: "Connexion — ClaimDesk OMNIVIA" },
      {
        property: "og:description",
        content: "Espace sécurisé de gestion des réclamations clients d'OMNIVIA.",
      },
    ],
  }),
  component: AuthPage,
});

async function destinationFor(userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("manager")) return "/analytics" as const;
  if (roles.includes("agent")) return "/agent" as const;
  return "/portail" as const;
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) {
      toast.error(error?.message ?? "Connexion impossible.");
      return;
    }
    navigate({ to: await destinationFor(data.user.id), replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nom, consentement_rgpd: true },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Compte créé. Confirmez votre adresse e-mail pour accéder à ClaimDesk.");
      return;
    }
    navigate({ to: await destinationFor(data.session.user.id), replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-14">
      <div className="mb-8 flex items-center gap-3">
        <Scale className="size-7 text-brass" aria-hidden />
        <span className="font-serif text-2xl text-foreground">
          ClaimDesk{" "}
          <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">OMNIVIA</span>
        </span>
      </div>

      <div className="sheet-panel w-full max-w-md p-7">
        <Tabs defaultValue="login">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="login" className="flex-1">
              Connexion
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Créer un accès
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd">Mot de passe</Label>
                <Input
                  id="pwd"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Vérification…" : "Accéder à mon espace"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email2">Adresse e-mail</Label>
                <Input
                  id="email2"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd2">Mot de passe</Label>
                <Input
                  id="pwd2"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Votre accès est créé avec le profil client. Les profils agent et management sont
                attribués par le management depuis l'espace analytics.
              </p>
              <p className="text-xs text-muted-foreground">
                En créant un accès, vous consentez au traitement de vos données aux seules fins de
                la gestion des réclamations (RGPD).
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création…" : "Créer mon accès"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
