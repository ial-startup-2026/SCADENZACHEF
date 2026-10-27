/** Categorie merceologiche. Devono coincidere con il CHECK in `prodotti_magazzino.categoria`. */
export const CATEGORIE = [
  { codice: "carne", etichetta: "Carne" },
  { codice: "pesce", etichetta: "Pesce" },
  { codice: "latticini", etichetta: "Latticini e uova" },
  { codice: "ortofrutta", etichetta: "Ortofrutta" },
  { codice: "secco", etichetta: "Secco e farinacei" },
  { codice: "surgelati", etichetta: "Surgelati" },
  { codice: "salse", etichetta: "Salse e condimenti" },
  { codice: "bevande", etichetta: "Bevande" },
  { codice: "altro", etichetta: "Altro" },
] as const;

export type CodiceCategoria = (typeof CATEGORIE)[number]["codice"];
