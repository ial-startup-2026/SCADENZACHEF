/**
 * I 14 allergeni da dichiarare in UE (Reg. UE 1169/2011, all. II).
 * Unico punto di definizione: i codici devono coincidere con il CHECK
 * di `prodotti_magazzino.allergeni` nelle migrazioni (lo verifica un test).
 * Le icone si aggiungono in Fase 5.
 */
export const ALLERGENI = [
  { codice: "glutine", etichetta: "Glutine", dettaglio: "Cereali contenenti glutine" },
  { codice: "crostacei", etichetta: "Crostacei", dettaglio: "Crostacei e derivati" },
  { codice: "uova", etichetta: "Uova", dettaglio: "Uova e derivati" },
  { codice: "pesce", etichetta: "Pesce", dettaglio: "Pesce e derivati" },
  { codice: "arachidi", etichetta: "Arachidi", dettaglio: "Arachidi e derivati" },
  { codice: "soia", etichetta: "Soia", dettaglio: "Soia e derivati" },
  { codice: "latte", etichetta: "Latte", dettaglio: "Latte e derivati (lattosio incluso)" },
  { codice: "frutta_a_guscio", etichetta: "Frutta a guscio", dettaglio: "Mandorle, nocciole, noci, pistacchi…" },
  { codice: "sedano", etichetta: "Sedano", dettaglio: "Sedano e derivati" },
  { codice: "senape", etichetta: "Senape", dettaglio: "Senape e derivati" },
  { codice: "sesamo", etichetta: "Sesamo", dettaglio: "Semi di sesamo e derivati" },
  { codice: "solfiti", etichetta: "Solfiti", dettaglio: "Anidride solforosa e solfiti (> 10 mg/kg)" },
  { codice: "lupini", etichetta: "Lupini", dettaglio: "Lupini e derivati" },
  { codice: "molluschi", etichetta: "Molluschi", dettaglio: "Molluschi e derivati" },
] as const;

export type CodiceAllergene = (typeof ALLERGENI)[number]["codice"];

export const CODICI_ALLERGENI: readonly CodiceAllergene[] = ALLERGENI.map((a) => a.codice);

export const AVVISO_ALLERGENI =
  "Allergeni letti automaticamente dall'etichetta. Verifica sempre l'etichetta originale prima di servire un cliente allergico.";
