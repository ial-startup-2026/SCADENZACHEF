import type { CodiceAllergene } from "@/lib/costanti/allergeni";
import type { CodiceCategoria } from "@/lib/costanti/categorie";
import type { CodicePosizione } from "@/lib/costanti/posizioni";
import type { CodiceUnita } from "@/lib/costanti/unita";
import { dataOggi } from "@/lib/scadenze/stato-scadenza";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";

const aggiungiGiorni = (data: string, giorni: number) => {
  const [a, m, g] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, g + giorni)).toISOString().slice(0, 10);
};

type Riga = [string, CodiceCategoria, CodicePosizione, number, CodiceUnita, number, CodiceAllergene[]];

// nome, categoria, posizione, quantità, unità, giorni a scadenza, allergeni
const RIGHE: Riga[] = [
  ["Panna fresca", "latticini", "cella_frigo", 2, "l", -3, ["latte"]],
  ["Gamberi sgusciati", "pesce", "cella_frigo", 1.5, "kg", -1, ["crostacei"]],
  ["Mozzarella di bufala", "latticini", "cella_frigo", 4, "pz", 0, ["latte"]],
  ["Petto di pollo", "carne", "cella_frigo", 3, "kg", 0, []],
  ["Burrata", "latticini", "cella_frigo", 6, "pz", 1, ["latte"]],
  ["Salmone affumicato", "pesce", "cella_frigo", 1, "kg", 2, ["pesce"]],
  ["Pane per tartine", "secco", "banco", 20, "pz", 2, ["glutine", "sesamo"]],
  ["Uova fresche", "latticini", "cella_frigo", 60, "pz", 3, ["uova"]],
  ["Basilico fresco", "ortofrutta", "cella_frigo", 10, "conf", 4, []],
  ["Ricotta", "latticini", "cella_frigo", 3, "kg", 6, ["latte"]],
  ["Salsa al pesto", "salse", "cella_frigo", 2, "pz", 7, ["frutta_a_guscio", "latte"]],
  ["Pasta fresca all'uovo", "secco", "cella_frigo", 5, "kg", 9, ["glutine", "uova"]],
  ["Gelato alla nocciola", "surgelati", "freezer", 5, "kg", 90, ["latte", "frutta_a_guscio"]],
  ["Farina 00", "secco", "dispensa_secca", 25, "kg", 120, ["glutine"]],
  ["Olio extravergine", "salse", "dispensa_secca", 10, "l", 400, []],
];

/** Dati di prova con scadenze relative a oggi: ci sono prodotti in tutti gli stati del semaforo. */
export function prodottiDemo(adessoIso: string): ProdottoMagazzino[] {
  const oggi = dataOggi(new Date(adessoIso));
  return RIGHE.map(([nome, categoria, posizione, quantita, unita, giorni, allergeni], i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    nome,
    categoria,
    posizione,
    quantita,
    unita,
    data_scadenza: aggiungiGiorni(oggi, giorni),
    lotto: i % 3 === 0 ? `L26${10 + i}A` : null,
    allergeni,
    stato: "attivo",
    creato_il: `2026-10-${String(10 + (i % 15)).padStart(2, "0")}T08:00:00Z`,
  }));
}
