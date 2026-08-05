import { Stamp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIBELLES_STATUT, type Statut } from "@/lib/qualification";

const tone: Record<Statut, string> = {
  cree: "border-muted-foreground/40 bg-muted text-muted-foreground",
  qualifie: "border-brass/60 bg-brass/15 text-brass",
  instruction: "border-ink/40 bg-ink/10 text-ink",
  resolu: "border-forest/50 bg-forest/15 text-forest",
  rejete: "border-brick/50 bg-brick/15 text-brick",
  escalade: "border-brick/40 bg-brick/10 text-brick",
};

/** Badge "tampon officiel" — métaphore signature de ClaimDesk. */
export function StatutStamp({ statut, className }: { statut: Statut; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-dashed px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
        tone[statut],
        className,
      )}
    >
      <Stamp className="size-3.5" aria-hidden />
      {LIBELLES_STATUT[statut]}
    </span>
  );
}
