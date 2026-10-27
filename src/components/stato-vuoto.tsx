import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  icona: LucideIcon;
  titolo: string;
  descrizione: string;
  azione?: { href: string; etichetta: string; icona?: LucideIcon };
};

export function StatoVuoto({ icona: Icona, titolo, descrizione, azione }: Props) {
  const IconaAzione = azione?.icona;
  return (
    <section className="animazione-entra relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-carta">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary-soft" />
      <span className="relative flex size-20 items-center justify-center rounded-3xl bg-primary-soft text-primary ring-8 ring-primary-soft/60">
        <Icona className="size-10" aria-hidden />
      </span>
      <h2 className="relative text-2xl font-extrabold">{titolo}</h2>
      <p className="relative max-w-xs text-muted-foreground">{descrizione}</p>
      {azione && (
        <Link
          href={azione.href}
          className={cn(buttonVariants({ size: "lg" }), "relative mt-2 w-full max-w-xs")}
        >
          {IconaAzione && <IconaAzione aria-hidden />}
          {azione.etichetta}
        </Link>
      )}
    </section>
  );
}
