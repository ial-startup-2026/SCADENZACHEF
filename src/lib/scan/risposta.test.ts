import { describe, expect, it } from "vitest";
import { esitoDaRisposta } from "./risposta";

const lettura = {
  nome: "Burrata",
  data_scadenza: "2026-11-02",
  lotto: null,
  allergeni: ["latte"],
  quantita: 125,
  unita: "g",
  confidenza: { nome: 1, data_scadenza: 1, lotto: 0, allergeni: 1, quantita: 1, globale: 1 },
};

describe("esitoDaRisposta", () => {
  it("accetta una lettura valida", () => {
    expect(esitoDaRisposta({ ok: true, origine: "ai", lettura })).toMatchObject({ ok: true, origine: "ai" });
    expect(esitoDaRisposta({ ok: true, origine: "prova", lettura })).toMatchObject({ ok: true, origine: "prova" });
  });

  it("riconosce i motivi di fallimento noti", () => {
    expect(esitoDaRisposta({ ok: false, motivo: "troppe_richieste" })).toEqual({ ok: false, motivo: "troppe_richieste" });
    expect(esitoDaRisposta({ ok: false, motivo: "non_configurato" })).toEqual({ ok: false, motivo: "non_configurato" });
  });

  it("tutto il resto diventa un errore generico", () => {
    for (const strano of [null, undefined, "testo", 5, {}, { ok: true }, { ok: true, origine: "ai", lettura: { nome: 1 } }, { ok: true, origine: "boh", lettura }, { ok: false, motivo: "inventato" }]) {
      expect(esitoDaRisposta(strano)).toEqual({ ok: false, motivo: "errore" });
    }
  });
});
