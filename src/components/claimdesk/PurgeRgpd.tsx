import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { purgerDossiersResolus } from "@/lib/claims.functions";

/** Panneau manager : purge RGPD des dossiers résolus depuis plus de 3 ans. */
export function PurgeRgpd() {
  const submit = useServerFn(purgerDossiersResolus);

  const mutation = useMutation({
    mutationFn: () => submit(),
    onSuccess: ({ supprimes }) => {
      toast.success(
        supprimes > 0
          ? `${supprimes} dossier(s) résolu(s) supprimé(s).`
          : "Aucun dossier résolu de plus de 3 ans à purger.",
      );
    },
    onError: (e: Error) => toast.error(e.message || "Purge impossible."),
  });

  return (
    <div className="sheet-panel p-6">
      <h2 className="mb-1 text-lg">Conformité RGPD</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Supprime définitivement les dossiers résolus depuis plus de 3 ans, au-delà de la durée de
        conservation nécessaire au traitement.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={mutation.isPending}>
            {mutation.isPending ? "Purge…" : "Purger les dossiers résolus de plus de 3 ans"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la purge RGPD</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprime définitivement tous les dossiers résolus depuis plus de 3 ans.
              Elle est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => mutation.mutate()}>Purger</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
