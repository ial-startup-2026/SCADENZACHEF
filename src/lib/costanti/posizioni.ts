/** Dove si trova un prodotto. Devono coincidere con il CHECK in `prodotti_magazzino.posizione`. */
export const POSIZIONI = [
  { codice: "cella_frigo", etichetta: "Cella frigo" },
  { codice: "freezer", etichetta: "Freezer" },
  { codice: "dispensa_secca", etichetta: "Dispensa secca" },
  { codice: "cella_negativa", etichetta: "Cella negativa" },
  { codice: "banco", etichetta: "Banco" },
] as const;

export type CodicePosizione = (typeof POSIZIONI)[number]["codice"];
