import { describe, expect, it } from "vitest";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import {
  contaPerStato,
  FILTRI_VUOTI,
  filtraProdotti,
  haFiltriAttivi,
  normalizza,
  ordinaFEFO,
} from "./catalogo";

const ADESSO = new Date("2026-10-27T11:00:00Z"); // 27 ottobre, 12:00 a Roma

let n = 0;
const prodotto = (over: Partial<ProdottoMagazzino> & { scadenza?: string }): ProdottoMagazzino => {
  n++;
  const { scadenza, ...resto } = over;
  return {
    id: `id-${n}`,
    nome: `Prodotto ${n}`,
    categoria: "altro",
    posizione: "cella_frigo",
    quantita: 1,
    unita: "pz",
    data_scadenza: scadenza ?? "2026-12-01",
    lotto: null,
    allergeni: [],
    stato: "attivo",
    creato_il: `2026-10-0${(n % 9) + 1}T10:00:00Z`,
    ...resto,
  };
};

describe("normalizza", () => {
  it("toglie accenti e maiuscole", () => {
    expect(normalizza("  Pâté di Fégato ")).toBe("pate di fegato");
    expect(normalizza("Caffè")).toBe("caffe");
  });
});

describe("ordinaFEFO", () => {
  it("prima chi scade prima; a parità il più vecchio; poi per nome", () => {
    const a = prodotto({ nome: "B", scadenza: "2026-11-02", creato_il: "2026-10-02T10:00:00Z" });
    const b = prodotto({ nome: "A", scadenza: "2026-11-02", creato_il: "2026-10-01T10:00:00Z" });
    const c = prodotto({ nome: "C", scadenza: "2026-10-30", creato_il: "2026-10-09T10:00:00Z" });
    const d = prodotto({ nome: "Z", scadenza: "2026-11-02", creato_il: "2026-10-01T10:00:00Z" });
    expect(ordinaFEFO([a, b, c, d]).map((p) => p.nome)).toEqual(["C", "A", "Z", "B"]);
  });

  it("non modifica l'array originale", () => {
    const lista = [prodotto({ scadenza: "2026-12-01" }), prodotto({ scadenza: "2026-11-01" })];
    const copia = [...lista];
    ordinaFEFO(lista);
    expect(lista).toEqual(copia);
  });
});

describe("filtraProdotti", () => {
  const scaduto = prodotto({ nome: "Panna", scadenza: "2026-10-24", categoria: "latticini", allergeni: ["latte"] });
  const oggi = prodotto({ nome: "Pollo", scadenza: "2026-10-27", categoria: "carne", posizione: "cella_frigo" });
  const domani = prodotto({ nome: "Burrata", scadenza: "2026-10-28", categoria: "latticini", allergeni: ["latte"] });
  const sei = prodotto({ nome: "Pesto", scadenza: "2026-11-02", categoria: "salse", allergeni: ["frutta_a_guscio", "latte"] });
  const lontano = prodotto({ nome: "Farina", scadenza: "2027-02-01", categoria: "secco", posizione: "dispensa_secca", allergeni: ["glutine"] });
  const finito = prodotto({ nome: "Basilico", scadenza: "2026-10-30", stato: "finito" });
  const tutti = [lontano, sei, scaduto, finito, domani, oggi];

  const nomi = (f: Partial<typeof FILTRI_VUOTI>) =>
    filtraProdotti(tutti, { ...FILTRI_VUOTI, ...f }, ADESSO).map((p) => p.nome);

  it("senza filtri: solo gli attivi, in ordine FEFO", () => {
    expect(nomi({})).toEqual(["Panna", "Pollo", "Burrata", "Pesto", "Farina"]);
  });

  it("'Scade presto' = in scadenza, attenzione e oggi (non gli scaduti)", () => {
    expect(nomi({ stato: "presto" })).toEqual(["Pollo", "Burrata", "Pesto"]);
  });

  it("'Scaduti'", () => {
    expect(nomi({ stato: "scaduti" })).toEqual(["Panna"]);
  });

  it("ricerca per nome senza badare a maiuscole e accenti", () => {
    expect(nomi({ ricerca: "BURR" })).toEqual(["Burrata"]);
    expect(nomi({ ricerca: "  fari " })).toEqual(["Farina"]);
    expect(nomi({ ricerca: "zzz" })).toEqual([]);
  });

  it("posizione e categoria (più valori = oppure)", () => {
    expect(nomi({ posizioni: ["dispensa_secca"] })).toEqual(["Farina"]);
    expect(nomi({ categorie: ["latticini", "carne"] })).toEqual(["Panna", "Pollo", "Burrata"]);
  });

  it("'Senza allergene': esclude chi ne contiene anche uno solo di quelli scelti", () => {
    expect(nomi({ senzaAllergeni: ["latte"] })).toEqual(["Pollo", "Farina"]);
    expect(nomi({ senzaAllergeni: ["latte", "glutine"] })).toEqual(["Pollo"]);
    expect(nomi({ senzaAllergeni: ["frutta_a_guscio"] })).toEqual(["Panna", "Pollo", "Burrata", "Farina"]);
  });

  it("i filtri si combinano (e)", () => {
    expect(nomi({ categorie: ["latticini"], stato: "presto", senzaAllergeni: ["glutine"] })).toEqual(["Burrata"]);
  });

  it("usa le soglie personalizzate", () => {
    const risultato = filtraProdotti(tutti, { ...FILTRI_VUOTI, stato: "presto" }, ADESSO, { giallo: 2, arancione: 1 });
    expect(risultato.map((p) => p.nome)).toEqual(["Pollo", "Burrata"]); // Pesto (6 gg) ora è "OK"
  });
});

describe("haFiltriAttivi", () => {
  it("riconosce i filtri vuoti e quelli attivi", () => {
    expect(haFiltriAttivi(FILTRI_VUOTI)).toBe(false);
    expect(haFiltriAttivi({ ...FILTRI_VUOTI, ricerca: "   " })).toBe(false);
    expect(haFiltriAttivi({ ...FILTRI_VUOTI, ricerca: "a" })).toBe(true);
    expect(haFiltriAttivi({ ...FILTRI_VUOTI, stato: "scaduti" })).toBe(true);
    expect(haFiltriAttivi({ ...FILTRI_VUOTI, senzaAllergeni: ["uova"] })).toBe(true);
  });
});

describe("contaPerStato", () => {
  it("conta gli attivi per stato e ignora finiti e buttati", () => {
    const lista = [
      prodotto({ scadenza: "2026-10-20" }),
      prodotto({ scadenza: "2026-10-26" }),
      prodotto({ scadenza: "2026-10-27" }),
      prodotto({ scadenza: "2026-10-29" }),
      prodotto({ scadenza: "2026-11-01" }),
      prodotto({ scadenza: "2026-12-01" }),
      prodotto({ scadenza: "2026-10-20", stato: "buttato" }),
      prodotto({ scadenza: "2026-10-28", stato: "finito" }),
    ];
    expect(contaPerStato(lista, ADESSO)).toEqual({
      ok: 1,
      "in-scadenza": 1,
      attenzione: 1,
      oggi: 1,
      scaduto: 2,
    });
  });
});
