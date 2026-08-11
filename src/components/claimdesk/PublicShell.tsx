import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Scale } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUES, NOMS_LANGUES, traduire, type Langue } from "@/lib/i18n";

export function PublicShell({
  langue,
  onLangueChange,
  title,
  subtitle,
  children,
}: {
  langue: Langue;
  onLangueChange: (langue: Langue) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const t = (cle: Parameters<typeof traduire>[1]) => traduire(langue, cle);

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link to="/" className="flex items-center gap-3">
            <Scale className="size-6 text-brass" aria-hidden />
            <span className="font-serif text-xl">
              ClaimDesk{" "}
              <span className="text-sm uppercase tracking-[0.2em] opacity-70">OMNIVIA</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Select value={langue} onValueChange={(v) => onLangueChange(v as Langue)}>
              <SelectTrigger
                aria-label={t("langue.label")}
                className="h-9 w-[150px] border-brass/50 bg-transparent text-ink-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {NOMS_LANGUES[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link
              to="/suivi"
              className="rounded-md border border-brass/60 px-3 py-2 text-sm text-brass transition-colors hover:bg-brass/15"
            >
              {t("nav.suivi")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8 border-b border-border pb-5">
          <h1 className="text-3xl text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        {t("footer.mention")}
      </footer>
    </div>
  );
}