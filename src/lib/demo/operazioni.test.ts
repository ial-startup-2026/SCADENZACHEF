import { beforeEach, describe, expect, it } from "vitest";
import { annullaSu, modificaSu, registraSu, scaricaSu, type Registro } from "./operazioni";
import { prodottiDemo } from "./prodotti";

const ADESSO = "2026-10-27T11:00:00Z";
let registro: Registro;
const burrata = () => registro.prodotti.find((p) => p.nome === "Burrata")!;
const scarico = (over: Partial<Parameters<typeof scaricaSu>[1]> = {}) => ({
  clientUuid: crypto.randomUUID(),
  prodottoId: burrata().id,
  tipo: "scarico" as const,
  quantita: null,
  motivo: null,
  ...over,
});

beforeEach(() => {
  registro = { prodotti: prodottiDemo(ADESSO), movimenti: new Map() };
});

describe("prodottiDemo", () => {
  it("ha prodotti in tutti gli stati e id unici", () => {
    const p = prodottiDemo(ADESSO);
    expect(new Set(p.map((x) => x.id)).size).toBe(p.length);
    const date = p.map((x) => x.data_scadenza);
    expect(date.some((d) => d < "2026-10-27")).toBe(true);
    expect(date).toContain("2026-10-27");
    expect(date.some((d) => d > "2026-11-03")).toBe(true);
  });
});

describe("scaricaSu", () => {
  it("scarico parziale: resta attivo con la quantità rimasta", () => {
    const esito = scaricaSu(registro, scarico({ quantita: 2 }));
    expect(esito).toMatchObject({ ok: true, quantita: 4, stato: "attivo" });
    expect(burrata().quantita).toBe(4);
  });

  it("scarico totale → finito; spreco totale → buttato", () => {
    expect(scaricaSu(registro, scarico())).toMatchObject({ ok: true, quantita: 0, stato: "finito" });
    const altro = registro.prodotti.find((p) => p.nome === "Ricotta")!;
    expect(scaricaSu(registro, scarico({ prodottoId: altro.id, tipo: "spreco", motivo: "scaduto" }))).toMatchObject({
      ok: true,
      stato: "buttato",
    });
  });

  it("rifiuta quantità eccessive, prodotti già scaricati e id sconosciuti", () => {
    expect(scaricaSu(registro, scarico({ quantita: 7 }))).toEqual({ ok: false, errore: "La quantità non è valida." });
    scaricaSu(registro, scarico());
    expect(scaricaSu(registro, scarico())).toEqual({ ok: false, errore: "Questo prodotto è già stato scaricato." });
    expect(scaricaSu(registro, scarico({ prodottoId: "00000000-0000-4000-8000-ffffffffffff" }))).toEqual({
      ok: false,
      errore: "Prodotto non trovato.",
    });
  });
});

describe("annullaSu", () => {
  it("rimette la quantità e riattiva il prodotto, una sola volta", () => {
    const esito = scaricaSu(registro, scarico());
    if (!esito.ok) throw new Error("atteso ok");
    expect(annullaSu(registro, esito.movimentoId)).toEqual({ ok: true, quantita: 6, stato: "attivo" });
    expect(burrata().stato).toBe("attivo");
    expect(annullaSu(registro, esito.movimentoId).ok).toBe(false);
  });
});

describe("modificaSu", () => {
  it("cambia i dati descrittivi e non la quantità", () => {
    const esito = modificaSu(registro, burrata().id, {
      nome: "Burrata pugliese",
      categoria: "latticini",
      posizione: "banco",
      unita: "pz",
      data_scadenza: "2026-11-10",
      lotto: null,
      allergeni: ["latte"],
    });
    expect(esito.ok && esito.prodotto).toMatchObject({ nome: "Burrata pugliese", posizione: "banco", quantita: 6 });
  });
});

describe("registraSu", () => {
  const nuovo = (over = {}) => ({
    clientUuid: crypto.randomUUID(),
    nome: "Burrata di Andria",
    categoria: "latticini" as const,
    posizione: "cella_frigo" as const,
    quantita: 2,
    unita: "pz" as const,
    data_scadenza: "2026-11-10",
    lotto: "L1",
    allergeni: ["latte" as const],
    fotoPath: null,
    ...over,
  });

  it("aggiunge un prodotto attivo con i dati dati", () => {
    const prima = registro.prodotti.length;
    const esito = registraSu(registro, nuovo());
    expect(esito).toMatchObject({ ok: true, ripetuto: false });
    expect(registro.prodotti).toHaveLength(prima + 1);
    expect(registro.prodotti.at(-1)).toMatchObject({ nome: "Burrata di Andria", stato: "attivo", quantita: 2, lotto: "L1" });
  });

  it("ripetere lo stesso invio (coda offline, doppio tocco) non crea doppioni", () => {
    const dati = nuovo();
    const a = registraSu(registro, dati);
    const prima = registro.prodotti.length;
    const b = registraSu(registro, dati);
    expect(registro.prodotti).toHaveLength(prima);
    expect(b).toMatchObject({ ok: true, ripetuto: true, prodottoId: a.ok ? a.prodottoId : "" });
  });

  it("il prodotto nuovo si può poi usare come gli altri", () => {
    const esito = registraSu(registro, nuovo());
    if (!esito.ok) throw new Error("atteso ok");
    expect(scaricaSu(registro, { clientUuid: crypto.randomUUID(), prodottoId: esito.prodottoId, tipo: "scarico", quantita: 1, motivo: null })).toMatchObject({ ok: true, quantita: 1 });
  });
});
