"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CodiceUnita } from "@/lib/costanti/unita";
import { arrotonda, formattaQuantita, PASSO_PER_UNITA } from "@/lib/quantita";
import { cn } from "@/lib/utils";

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
  /** Toccando il numero lo si può scrivere a mano (utile per "125 g", dove il passo di 100 non basta). */
  modificabile?: boolean;
};

/** Legge un numero scritto all'italiana ("2,5") o all'inglese ("2.5"); `null` se non è un numero. */
export function leggiNumero(testo: string): number | null {
  const pulito = testo.trim().replace(",", ".");
  if (pulito === "" || !/^\d*\.?\d*$/.test(pulito)) return null;
  const n = Number(pulito);
  return Number.isFinite(n) ? n : null;
}

/** Quantità con due grandi pulsanti − e +: si usa con una mano, anche con i guanti. */
export function Stepper({
  etichetta,
  valore,
  onChange,
  min,
  max,
  unita,
  passo = PASSO_PER_UNITA[unita],
  formatta,
  modificabile,
}: Props) {
  // Mentre si scrive il testo è libero ("1," è un testo valido a metà strada).
  const [bozza, setBozza] = useState<string | null>(null);

  const cambia = (delta: number) => {
    const prossimo = arrotonda(valore + delta);
    if (prossimo < min) return;
    onChange(Math.min(prossimo, max));
  };
  const tasto =
    "flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95 disabled:opacity-40";
  const stileNumero = "min-w-0 flex-1 text-center text-5xl font-light leading-none tracking-tight";

  return (
    <div role="group" aria-label={etichetta} className="flex items-center justify-between gap-3">
      <button type="button" className={tasto} onClick={() => cambia(-passo)} disabled={arrotonda(valore - passo) < min} aria-label="Meno">
        <Minus className="size-8" aria-hidden />
      </button>

      {modificabile ? (
        <input
          type="text"
          inputMode="decimal"
          aria-label={`${etichetta}: scrivi il valore`}
          className={cn(stileNumero, "rounded-2xl border-2 border-transparent bg-transparent py-1 focus:border-input")}
          value={bozza ?? String(valore).replace(".", ",")}
          onFocus={(e) => {
            setBozza(String(valore).replace(".", ","));
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setBozza(e.target.value);
            const n = leggiNumero(e.target.value);
            if (n !== null && n >= min && n <= max) onChange(n);
          }}
          onBlur={() => setBozza(null)}
        />
      ) : (
        <output aria-live="polite" className={stileNumero}>
          {formatta ? formatta(valore) : formattaQuantita(valore, unita)}
        </output>
      )}

      <button type="button" className={tasto} onClick={() => cambia(passo)} disabled={valore >= max} aria-label="Più">
        <Plus className="size-8" aria-hidden />
      </button>
    </div>
  );
}
