/** Configurazione dell'app. Il nome è provvisorio: cambia solo qui. */
export const APP_NAME = "ScadenzaChef";
export const APP_DESCRIPTION =
  "Il magazzino della tua cucina: cosa c'è, dove e fino a quando.";

export const LOCALE = "it-IT";
export const TIMEZONE = "Europe/Rome";

/**
 * Colori usati dal sistema operativo (barra di stato, schermata di avvio).
 * Devono coincidere con --background in globals.css
 * (lo verifica src/lib/design/token.test.ts).
 */
export const COLORI_PWA = {
  chiaro: { tema: "#ececf1", sfondo: "#ececf1" },
  scuro: { tema: "#0d0d11", sfondo: "#0d0d11" },
} as const;

/** Lettura delle etichette: la foto si riduce nel browser prima dell'invio. */
export const SCAN = {
  /** Lato lungo massimo dell'immagine inviata, in pixel. */
  latoMaxPx: 1600,
  qualitaJpeg: 0.8,
  /** Sotto questa confidenza (0-1) un campo va ricontrollato a mano. */
  confidenzaMinima: 0.6,
  /** Dimensione massima accettata dal server, in byte. */
  maxByte: 4_000_000,
  /** Richieste di lettura per utente in ogni finestra di tempo. */
  maxRichieste: 30,
  finestraMs: 10 * 60_000,
  /** Attesa massima per una lettura, in millisecondi. */
  timeoutMs: 30_000,
} as const;

/** Modello che legge le etichette; si può cambiare con la variabile ANTHROPIC_MODEL. */
export const MODELLO_SCAN_DEFAULT = "claude-sonnet-5-5";
