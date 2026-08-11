/** Cohérence des dates d'un dossier : achat ≤ livraison, et aucune date future. */
export interface CoherenceDates {
  date_achat: string;
  date_livraison?: string | null | undefined;
}

export type ErreurDates = "dates" | "futur" | null;

export function verifierDates(
  { date_achat, date_livraison }: CoherenceDates,
  today: Date = new Date(),
): ErreurDates {
  const finDuJour = new Date(today);
  finDuJour.setHours(23, 59, 59, 999);
  const achat = new Date(date_achat);
  const livraison = date_livraison ? new Date(date_livraison) : null;
  if (Number.isNaN(achat.getTime())) return "dates";
  if (livraison && Number.isNaN(livraison.getTime())) return "dates";
  if (achat > finDuJour || (livraison && livraison > finDuJour)) return "futur";
  if (livraison && livraison < achat) return "dates";
  return null;
}

export function aujourdHuiISO(today: Date = new Date()): string {
  return today.toISOString().slice(0, 10);
}