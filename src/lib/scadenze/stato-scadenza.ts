import { LOCALE, TIMEZONE } from "@/config/app";
import type { StatoScadenza } from "@/lib/costanti/stati-scadenza";
import { SOGLIE_DEFAULT, type Soglie } from "./soglie";

const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Millisecondi di mezzanotte UTC di una data `YYYY-MM-DD` (errore se non esiste, es. 2026-02-30). */
function giornoUtc(data: string): number {
  const m = FORMATO_DATA.exec(data);
  if (!m) throw new Error(`Data non valida: "${data}" (atteso YYYY-MM-DD)`);
  const [anno, mese, giorno] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(anno, mese - 1, giorno);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== anno || d.getUTCMonth() !== mese - 1 || d.getUTCDate() !== giorno) {
    throw new Error(`Data inesistente: "${data}"`);
  }
  return ms;
}

/** Data di calendario (`YYYY-MM-DD`) che è "oggi" nel fuso del ristorante. */
export function dataOggi(adesso: Date, tz: string = TIMEZONE): string {
  // en-CA formatta come YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(adesso);
}

/**
 * Giorni di calendario da oggi alla scadenza: 0 = oggi, 1 = domani, -1 = ieri.
 * Si confrontano date, non istanti: così il cambio dell'ora legale (giorni da 23 o 25 ore)
 * e il fuso del server non spostano mai il risultato.
 */
export function giorniAllaScadenza(dataScadenza: string, adesso: Date, tz: string = TIMEZONE): number {
  return Math.round((giornoUtc(dataScadenza) - giornoUtc(dataOggi(adesso, tz))) / 86_400_000);
}

/** Aggiunge (o toglie) giorni di calendario a una data `YYYY-MM-DD`. */
export function aggiungiGiorni(data: string, giorni: number): string {
  return new Date(giornoUtc(data) + giorni * 86_400_000).toISOString().slice(0, 10);
}

export type EsitoScadenza = {
  stato: StatoScadenza;
  /** Giorni alla scadenza (negativo se già scaduto). */
  giorni: number;
};

/** Stato del semaforo: OK > giallo > arancione > oggi > scaduto. */
export function statoScadenza(
  dataScadenza: string,
  adesso: Date,
  soglie: Soglie = SOGLIE_DEFAULT,
  tz: string = TIMEZONE,
): EsitoScadenza {
  const giorni = giorniAllaScadenza(dataScadenza, adesso, tz);
  let stato: StatoScadenza;
  if (giorni < 0) stato = "scaduto";
  else if (giorni === 0) stato = "oggi";
  else if (giorni <= soglie.arancione) stato = "attenzione";
  else if (giorni <= soglie.giallo) stato = "in-scadenza";
  else stato = "ok";
  return { stato, giorni };
}

/** "Scade domani", "Scade tra 5 giorni", "Scaduto da 2 giorni"… */
export function testoGiorni(giorni: number): string {
  if (giorni === 0) return "Scade oggi";
  if (giorni === 1) return "Scade domani";
  if (giorni > 1) return `Scade tra ${giorni} giorni`;
  if (giorni === -1) return "Scaduto ieri";
  return `Scaduto da ${-giorni} giorni`;
}

/**
 * Testo accanto al chip di stato, senza ripetere ciò che il chip già dice:
 * chip "Scaduto" + "da 3 giorni"; chip "Scade oggi" + niente; chip "Attenzione" + "Scade domani".
 */
export function dettaglioGiorni(stato: StatoScadenza, giorni: number): string | null {
  if (stato === "oggi") return null;
  if (stato === "scaduto") return testoGiorni(giorni).replace(/^Scaduto /, "");
  return testoGiorni(giorni);
}

/** "sab 1 nov" (aggiunge l'anno se non è quello in corso). */
export function dataBreve(dataScadenza: string, adesso: Date, tz: string = TIMEZONE): string {
  const ms = giornoUtc(dataScadenza);
  const stessoAnno = dataScadenza.slice(0, 4) === dataOggi(adesso, tz).slice(0, 4);
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: stessoAnno ? undefined : "numeric",
    timeZone: "UTC", // `ms` è già la data scelta, a mezzanotte UTC: nessuno spostamento di fuso
  })
    .format(new Date(ms))
    .replace(/\./g, "");
}
