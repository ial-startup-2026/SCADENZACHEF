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
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-input bg-card px-6 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icona className="size-8" aria-hidden />
      </span>
      <h2 className="text-xl font-bold">{titolo}</h2>
      <p className="max-w-xs text-muted-foreground">{descrizione}</p>
      {azione && (
        <Link
          href={azione.href}
          className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full max-w-xs")}
        >
          {IconaAzione && <IconaAzione aria-hidden />}
          {azione.etichetta}
        </Link>
      )}
    </section>
  );
}
