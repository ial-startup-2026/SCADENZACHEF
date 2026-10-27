/** Unità di misura. Devono coincidere con il CHECK in `unita` delle migrazioni. */
export const UNITA = [
  { codice: "pz", etichetta: "pz" },
  { codice: "kg", etichetta: "kg" },
  { codice: "g", etichetta: "g" },
  { codice: "l", etichetta: "l" },
  { codice: "ml", etichetta: "ml" },
  { codice: "conf", etichetta: "conf." },
] as const;

export type CodiceUnita = (typeof UNITA)[number]["codice"];
