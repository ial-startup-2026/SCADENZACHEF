import type { StatoScadenza } from "@/lib/costanti/stati-scadenza";

/** Dal più urgente al meno urgente: l'anello parte dal basso a sinistra e gira in senso orario. */
export const ORDINE_ANELLO: readonly StatoScadenza[] = ["scaduto", "oggi", "attenzione", "in-scadenza", "ok"];

/** Il cerchio è disegnato con lunghezza 100; l'arco copre 270° (75), aperto in basso. */
export const ARCO = 75;
/** Quanto una estremità arrotondata sporge oltre la linea (tratto 18 su raggio 80 ≈ 1,8). */
export const SPORGENZA = 1.8;
/** Spazio visibile tra due segmenti. */
export const SPAZIO = 1.2;

export type Segmento = { stato: StatoScadenza; n: number; lunghezza: number; inizio: number };

/**
 * Segmenti dell'anello in proporzione ai conteggi. Le estremità arrotondate sporgono, quindi la
 * lunghezza della linea è accorciata in modo che il segmento *visibile* occupi la sua quota e
 * tra un segmento e l'altro resti sempre uno spazio. Senza prodotti non c'è nessun segmento.
 */
export function segmentiAnello(conteggi: Record<StatoScadenza, number>): Segmento[] {
  const presenti = ORDINE_ANELLO.filter((s) => conteggi[s] > 0);
  const totale = presenti.reduce((somma, s) => somma + conteggi[s], 0);
  if (totale === 0) return [];

  const k = presenti.length;
  const disponibile = ARCO - 2 * SPORGENZA * k - SPAZIO * (k - 1);
  let inizio = SPORGENZA;
  return presenti.map((stato) => {
    const lunghezza = Math.max(0.01, (disponibile * conteggi[stato]) / totale);
    const segmento = { stato, n: conteggi[stato], lunghezza, inizio };
    inizio += lunghezza + 2 * SPORGENZA + SPAZIO;
    return segmento;
  });
}
