"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type VoceChip<T extends string> = { valore: T; etichetta: string };

type Props<T extends string> = {
  voci: readonly VoceChip<T>[];
  selezionati: readonly T[];
  onToggle: (valore: T) => void;
  etichetta: string;
  className?: string;
};

/** Scelta con chip: tocca per selezionare. Il selezionato ha la spunta, non solo il colore. */
export function GruppoChip<T extends string>({ voci, selezionati, onToggle, etichetta, className }: Props<T>) {
  return (
    <div role="group" aria-label={etichetta} className={cn("flex flex-wrap gap-2", className)}>
      {voci.map(({ valore, etichetta: testo }) => {
        const attivo = selezionati.includes(valore);
        return (
          <button
            key={valore}
            type="button"
            aria-pressed={attivo}
            onClick={() => onToggle(valore)}
            className={cn(
              "inline-flex min-h-12 items-center gap-1.5 rounded-full border-2 px-4 text-base font-medium active:scale-95",
              attivo ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary text-foreground",
            )}
          >
            {attivo && <Check className="size-5" aria-hidden />}
            {testo}
          </button>
        );
      })}
    </div>
  );
}
