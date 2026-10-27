import { describe, expect, it } from "vitest";
import { ARCO, SPAZIO, SPORGENZA, segmentiAnello } from "./anello";

const conteggi = (parziale: Partial<Record<"ok" | "in-scadenza" | "attenzione" | "oggi" | "scaduto", number>>) => ({
  ok: 0,
  "in-scadenza": 0,
  attenzione: 0,
  oggi: 0,
  scaduto: 0,
  ...parziale,
});

describe("segmentiAnello", () => {
  it("senza prodotti non disegna segmenti", () => {
    expect(segmentiAnello(conteggi({}))).toEqual([]);
  });

  it("un solo stato occupa tutto l'arco", () => {
    const [s] = segmentiAnello(conteggi({ ok: 12 }));
    expect(s.inizio).toBeCloseTo(SPORGENZA);
    expect(s.inizio + s.lunghezza + SPORGENZA).toBeCloseTo(ARCO);
  });

  it("i segmenti sono in ordine di urgenza, proporzionali e non si sovrappongono", () => {
    const seg = segmentiAnello(conteggi({ ok: 10, scaduto: 2, attenzione: 4 }));
    expect(seg.map((s) => s.stato)).toEqual(["scaduto", "attenzione", "ok"]);

    const visibili = seg.map((s) => s.lunghezza);
    expect(visibili[2] / visibili[0]).toBeCloseTo(5); // 10 contro 2
    for (let i = 1; i < seg.length; i++) {
      const fineMarginePrec = seg[i - 1].inizio + seg[i - 1].lunghezza + SPORGENZA;
      const inizioMargine = seg[i].inizio - SPORGENZA;
      expect(inizioMargine - fineMarginePrec).toBeCloseTo(SPAZIO);
    }
    const ultimo = seg.at(-1)!;
    expect(ultimo.inizio + ultimo.lunghezza + SPORGENZA).toBeCloseTo(ARCO);
  });

  it("un prodotto solo tra tanti resta comunque visibile", () => {
    const seg = segmentiAnello(conteggi({ ok: 500, oggi: 1 }));
    expect(seg.find((s) => s.stato === "oggi")!.lunghezza).toBeGreaterThan(0);
  });
});
