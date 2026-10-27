import { SCAN } from "@/config/app";
import type { Campo, Lettura } from "./tipi";

export type Valutazione = {
  /** Campi da ricontrollare a mano (illeggibili o poco sicuri). */
  daControllare: ReadonlySet<Campo>;
  /** Vero se manca o è dubbio qualcosa di importante: nome, scadenza o allergeni. */
  bassaConfidenza: boolean;
};

/**
 * Quali campi vanno ricontrollati. Nome e scadenza servono sempre: se mancano o sono dubbi si segnalano.
 * Lotto e quantità sono facoltativi: si segnalano solo se letti con poca sicurezza.
 * Gli allergeni si segnalano quando la lettura è poco sicura anche se la lista è vuota:
 * "nessun allergene letto" non significa "senza allergeni".
 */
export function valutaLettura(lettura: Lettura, minima: number = SCAN.confidenzaMinima): Valutazione {
  const c = lettura.confidenza;
  const campi = new Set<Campo>();
  if (lettura.nome === null || c.nome < minima) campi.add("nome");
  if (lettura.data_scadenza === null || c.data_scadenza < minima) campi.add("data_scadenza");
  if (c.allergeni < minima) campi.add("allergeni");
  if (lettura.lotto !== null && c.lotto < minima) campi.add("lotto");
  if (lettura.quantita !== null && c.quantita < minima) campi.add("quantita");

  const importante = campi.has("nome") || campi.has("data_scadenza") || campi.has("allergeni");
  return { daControllare: campi, bassaConfidenza: importante || c.globale < minima };
}
