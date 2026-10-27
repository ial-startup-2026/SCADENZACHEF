/** Configurazione dell'app. Il nome è provvisorio: cambia solo qui. */
export const APP_NAME = "ScadenzaChef";
export const APP_DESCRIPTION =
  "Il magazzino della tua cucina: cosa c'è, dove e fino a quando.";

export const LOCALE = "it-IT";
export const TIMEZONE = "Europe/Rome";

/**
 * Colori usati dal sistema operativo (barra di stato, schermata di avvio).
 * Devono coincidere con --primary e --background in globals.css
 * (lo verifica src/lib/design/token.test.ts).
 */
export const COLORI_PWA = {
  chiaro: { tema: "#1f5a3f", sfondo: "#f6f4ee" },
  scuro: { tema: "#0f1311", sfondo: "#0f1311" },
} as const;
