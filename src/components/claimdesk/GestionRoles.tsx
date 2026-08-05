import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attribuerRole } from "@/lib/claims.functions";

/** Panneau manager : promotion d'un compte existant vers agent ou management. */
export function GestionRoles() {
  const submit = useServerFn(attribuerRole);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "manager">("agent");

  const mutation = useMutation({
    mutationFn: () => submit({ data: { email, role } }),
    onSuccess: () => {
      toast.success(`Rôle ${role} attribué à ${email}`);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: Error) => toast.error(e.message || "Attribution impossible."),
  });

  return (
    <div className="sheet-panel p-6">
      <h2 className="mb-1 text-lg">Attribution des rôles</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Promouvez un compte existant (créé avec le profil client par défaut) vers agent ou
        management, à partir de son e-mail d'inscription.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="role-email">E-mail du compte</Label>
          <Input
            id="role-email"
            type="email"
            required
            className="w-64"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Rôle</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "agent" | "manager")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agent">Agent de traitement</SelectItem>
              <SelectItem value="manager">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Attribution…" : "Attribuer"}
        </Button>
      </form>
    </div>
  );
}
