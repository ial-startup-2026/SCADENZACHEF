import { LOCALE } from "@/config/app";
import { UNITA, type CodiceUnita } from "@/lib/costanti/unita";

/** Di quanto cambia la quantità a ogni tocco dello stepper. */
export const PASSO_PER_UNITA: Record<CodiceUnita, number> = {
  pz: 1,
  conf: 1,
  kg: 0.5,
  l: 0.5,
  g: 100,
  ml: 100,
};

/** Arrotonda a 3 decimali (come il database): evita 0.1 + 0.2 = 0.30000000000000004. */
export const arrotonda = (n: number) => Math.round(n * 1000) / 1000;

/** Tiene `n` tra `min` e `max`. */
export const limita = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** "2,5 kg", "12 pz", "0,25 L" (il litro è maiuscolo: "l" si confonde con "1"). */
export function formattaQuantita(n: number, unita: CodiceUnita): string {
  const numero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 }).format(arrotonda(n));
  return `${numero} ${UNITA.find((u) => u.codice === unita)?.etichetta ?? unita}`;
}

/** Quantità proposte come scorciatoia: ¼, ½, ¾ e tutto (senza doppioni e fuori scala). */
export function scorciatoie(max: number, unita: CodiceUnita): { etichetta: string; valore: number }[] {
  const passo = PASSO_PER_UNITA[unita];
  const frazioni = [
    { etichetta: "¼", f: 0.25 },
    { etichetta: "½", f: 0.5 },
    { etichetta: "¾", f: 0.75 },
  ]
    .map(({ etichetta, f }) => ({ etichetta, valore: arrotonda(Math.round((max * f) / passo) * passo) }))
    .filter((s) => s.valore > 0 && s.valore < max);
  const viste = new Set<number>();
  const uniche = frazioni.filter((s) => (viste.has(s.valore) ? false : (viste.add(s.valore), true)));
  return [...uniche, { etichetta: "Tutto", valore: max }];
}
