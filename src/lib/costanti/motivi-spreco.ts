/** Motivi per cui un prodotto viene buttato. Devono coincidere con il CHECK in `movimenti.motivo`. */
export const MOTIVI_SPRECO = [
  { codice: "scaduto", etichetta: "Scaduto" },
  { codice: "rovinato", etichetta: "Rovinato" },
  { codice: "errore", etichetta: "Errore in cucina" },
  { codice: "avanzo", etichetta: "Avanzo non riutilizzabile" },
  { codice: "altro", etichetta: "Altro" },
] as const;

export type CodiceMotivoSpreco = (typeof MOTIVI_SPRECO)[number]["codice"];
