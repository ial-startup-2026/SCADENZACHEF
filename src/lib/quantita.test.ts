import { describe, expect, it } from "vitest";
import { arrotonda, formattaQuantita, limita, scorciatoie } from "./quantita";

describe("quantità", () => {
  it("arrotonda gli errori dei decimali", () => {
    expect(arrotonda(0.1 + 0.2)).toBe(0.3);
    expect(arrotonda(2.0004)).toBe(2);
  });

  it("limita", () => {
    expect(limita(5, 1, 3)).toBe(3);
    expect(limita(-1, 0, 3)).toBe(0);
    expect(limita(2, 0, 3)).toBe(2);
  });

  it("formatta all'italiana con l'unità", () => {
    expect(formattaQuantita(2.5, "kg")).toBe("2,5 kg");
    expect(formattaQuantita(12, "pz")).toBe("12 pz");
    expect(formattaQuantita(3, "conf")).toBe("3 conf.");
    expect(formattaQuantita(0.25, "l")).toBe("0,25 L");
    expect(formattaQuantita(1500, "g")).toBe("1500 g"); // in italiano il punto parte dalle 5 cifre
    expect(formattaQuantita(12000, "g")).toBe("12.000 g");
  });
});

describe("scorciatoie", () => {
  it("propone frazioni arrotondate al passo e 'Tutto'", () => {
    expect(scorciatoie(10, "kg")).toEqual([
      { etichetta: "¼", valore: 2.5 },
      { etichetta: "½", valore: 5 },
      { etichetta: "¾", valore: 7.5 },
      { etichetta: "Tutto", valore: 10 },
    ]);
  });

  it("con poche unità toglie i doppioni e quelli che non hanno senso", () => {
    expect(scorciatoie(1, "pz")).toEqual([{ etichetta: "Tutto", valore: 1 }]);
    const sei = scorciatoie(6, "pz").map((s) => s.valore);
    expect(new Set(sei).size).toBe(sei.length);
    expect(sei.at(-1)).toBe(6);
    expect(sei.every((v) => v > 0 && v <= 6)).toBe(true);
  });
});
