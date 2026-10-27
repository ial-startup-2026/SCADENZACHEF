import { cn } from "@/lib/utils";
import {
  PRESENTAZIONE_STATO,
  type StatoScadenza,
} from "@/lib/costanti/stati-scadenza";

type Props = {
  stato: StatoScadenza;
  /** Testo al posto dell'etichetta di default, es. "Scade domani". */
  testo?: string;
  className?: string;
};

/** Stato di scadenza: colore + icona + testo, mai solo colore. */
export function ChipStato({ stato, testo, className }: Props) {
  const { etichetta, icona: Icona, classi } = PRESENTAZIONE_STATO[stato];
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border-2 px-3 text-base font-bold",
        classi,
        className,
      )}
    >
      <Icona className="size-5" aria-hidden />
      {testo ?? etichetta}
    </span>
  );
}
