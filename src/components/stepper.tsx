"use client";

import { Minus, Plus } from "lucide-react";
import type { CodiceUnita } from "@/lib/costanti/unita";
import { arrotonda, formattaQuantita, limita, PASSO_PER_UNITA } from "@/lib/quantita";

type Props = {
  etichetta: string;
  valore: number;
  onChange: (valore: number) => void;
  min: number;
  max: number;
  unita: CodiceUnita;
  passo?: number;
  /** Come scrivere il valore (di default quantità + unità, es. "2,5 kg"). */
  formatta?: (valore: number) => string;
};

/** Quantità con due grandi pulsanti − e +: si usa con una mano, anche con i guanti. */
export function Stepper({ etichetta, valore, onChange, min, max, unita, passo = PASSO_PER_UNITA[unita], formatta }: Props) {
  const cambia = (delta: number) => onChange(limita(arrotonda(valore + delta), min, max));
  const tasto =
    "flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95 disabled:opacity-40";

  return (
    <div role="group" aria-label={etichetta} className="flex items-center justify-between gap-3">
      <button type="button" className={tasto} onClick={() => cambia(-passo)} disabled={valore <= min} aria-label="Meno">
        <Minus className="size-8" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-0 flex-1 text-center text-5xl font-light leading-none tracking-tight">
        {formatta ? formatta(valore) : formattaQuantita(valore, unita)}
      </output>
      <button type="button" className={tasto} onClick={() => cambia(passo)} disabled={valore >= max} aria-label="Più">
        <Plus className="size-8" aria-hidden />
      </button>
    </div>
  );
}
