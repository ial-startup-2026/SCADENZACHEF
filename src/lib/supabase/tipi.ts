// Tipi delle righe lette dall'app. Sono scritti a mano e vanno tenuti allineati alle migrazioni;
// quando c'è un progetto Supabase collegato si possono sostituire con `supabase gen types`.
import type { Ruolo } from "@/lib/costanti/ruoli";

export type Profilo = {
  id: string;
  locale_id: string;
  nome: string;
  ruolo_cucina: string | null;
  ruolo: Ruolo;
  foto_url: string | null;
};

export type Locale = { id: string; nome: string };

import type { CodiceAllergene } from "@/lib/costanti/allergeni";
import type { CodiceCategoria } from "@/lib/costanti/categorie";
import type { CodicePosizione } from "@/lib/costanti/posizioni";
import type { CodiceUnita } from "@/lib/costanti/unita";

/** Colonne di `prodotti_magazzino` lette dal catalogo. */
export type ProdottoMagazzino = {
  id: string;
  nome: string;
  categoria: CodiceCategoria;
  posizione: CodicePosizione;
  quantita: number;
  unita: CodiceUnita;
  /** Data di calendario `YYYY-MM-DD`. */
  data_scadenza: string;
  lotto: string | null;
  allergeni: CodiceAllergene[];
  stato: "attivo" | "finito" | "buttato";
  creato_il: string;
};

export const COLONNE_PRODOTTO =
  "id, nome, categoria, posizione, quantita, unita, data_scadenza, lotto, allergeni, stato, creato_il";
