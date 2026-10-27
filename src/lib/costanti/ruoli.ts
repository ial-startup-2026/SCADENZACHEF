export const RUOLI = [
  { codice: "staff", etichetta: "Staff" },
  { codice: "admin", etichetta: "Admin" },
] as const;

export type Ruolo = (typeof RUOLI)[number]["codice"];

/** Ruoli in cucina suggeriti nel profilo (il campo resta libero). */
export const RUOLI_CUCINA = [
  "Chef",
  "Sous chef",
  "Capo partita",
  "Cuoco",
  "Aiuto cuoco",
  "Pasticcere",
  "Plongeur",
  "Sala",
] as const;
