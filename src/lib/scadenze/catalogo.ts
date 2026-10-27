import type { CodiceAllergene } from "@/lib/costanti/allergeni";
import type { CodiceCategoria } from "@/lib/costanti/categorie";
import type { CodicePosizione } from "@/lib/costanti/posizioni";
import type { StatoScadenza } from "@/lib/costanti/stati-scadenza";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import { SOGLIE_DEFAULT, type Soglie } from "./soglie";
import { statoScadenza } from "./stato-scadenza";

/** Minuscolo e senza accenti: "Pâté" si trova scrivendo "pate". */
export function normalizza(testo: string): string {
  return testo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** FEFO: scade prima, esce prima. A parità, il più vecchio inserito, poi per nome. */
export function ordinaFEFO<T extends Pick<ProdottoMagazzino, "data_scadenza" | "creato_il" | "nome">>(
  prodotti: readonly T[],
): T[] {
  return [...prodotti].sort(
    (a, b) =>
      a.data_scadenza.localeCompare(b.data_scadenza) ||
      a.creato_il.localeCompare(b.creato_il) ||
      a.nome.localeCompare(b.nome, "it"),
  );
}

/** Filtro rapido per urgenza: "presto" = in scadenza, attenzione o oggi (gli scaduti hanno il loro). */
export type FiltroStato = "tutti" | "presto" | "scaduti";

export type Filtri = {
  ricerca: string;
  stato: FiltroStato;
  posizioni: readonly CodicePosizione[];
  categorie: readonly CodiceCategoria[];
  /** Mostra solo i prodotti che NON contengono nessuno di questi allergeni. */
  senzaAllergeni: readonly CodiceAllergene[];
};

export const FILTRI_VUOTI: Filtri = {
  ricerca: "",
  stato: "tutti",
  posizioni: [],
  categorie: [],
  senzaAllergeni: [],
};

export function haFiltriAttivi(f: Filtri): boolean {
  return (
    normalizza(f.ricerca) !== "" ||
    f.stato !== "tutti" ||
    f.posizioni.length > 0 ||
    f.categorie.length > 0 ||
    f.senzaAllergeni.length > 0
  );
}

const STATI_PRESTO: readonly StatoScadenza[] = ["in-scadenza", "attenzione", "oggi"];

/** Solo prodotti attivi, filtrati e in ordine FEFO. */
export function filtraProdotti(
  prodotti: readonly ProdottoMagazzino[],
  filtri: Filtri,
  adesso: Date,
  soglie: Soglie = SOGLIE_DEFAULT,
): ProdottoMagazzino[] {
  const cerca = normalizza(filtri.ricerca);
  const filtrati = prodotti.filter((p) => {
    if (p.stato !== "attivo") return false;
    if (cerca && !normalizza(p.nome).includes(cerca)) return false;
    if (filtri.posizioni.length > 0 && !filtri.posizioni.includes(p.posizione)) return false;
    if (filtri.categorie.length > 0 && !filtri.categorie.includes(p.categoria)) return false;
    if (filtri.senzaAllergeni.some((a) => p.allergeni.includes(a))) return false;
    if (filtri.stato !== "tutti") {
      const { stato } = statoScadenza(p.data_scadenza, adesso, soglie);
      if (filtri.stato === "scaduti" ? stato !== "scaduto" : !STATI_PRESTO.includes(stato)) return false;
    }
    return true;
  });
  return ordinaFEFO(filtrati);
}

export type ConteggiStato = Record<StatoScadenza, number>;

/** Quanti prodotti attivi ci sono in ogni stato del semaforo. */
export function contaPerStato(
  prodotti: readonly Pick<ProdottoMagazzino, "data_scadenza" | "stato">[],
  adesso: Date,
  soglie: Soglie = SOGLIE_DEFAULT,
): ConteggiStato {
  const conteggi: ConteggiStato = { ok: 0, "in-scadenza": 0, attenzione: 0, oggi: 0, scaduto: 0 };
  for (const p of prodotti) {
    if (p.stato === "attivo") conteggi[statoScadenza(p.data_scadenza, adesso, soglie).stato]++;
  }
  return conteggi;
}
