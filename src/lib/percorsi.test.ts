import { describe, expect, it } from "vitest";
import { eRotaPubblica, percorsoSicuro } from "./percorsi";

describe("percorsoSicuro", () => {
  it.each([
    ["/magazzino", "/magazzino"],
    ["/benvenuto?codice=ABC123", "/benvenuto?codice=ABC123"],
    ["/", "/"],
  ])("accetta il percorso interno %s", (ingresso, atteso) => {
    expect(percorsoSicuro(ingresso)).toBe(atteso);
  });

  it.each([
    "https://sito-cattivo.example",
    "//sito-cattivo.example",
    "/\\sito-cattivo.example",
    "javascript:alert(1)",
    "magazzino",
    "",
  ])("scarta %j", (ingresso) => {
    expect(percorsoSicuro(ingresso)).toBe("/");
  });

  it("gestisce valori assenti e un predefinito diverso", () => {
    expect(percorsoSicuro(null)).toBe("/");
    expect(percorsoSicuro(undefined, "/benvenuto")).toBe("/benvenuto");
  });
});

describe("eRotaPubblica", () => {
  it("riconosce le pagine aperte a tutti", () => {
    expect(eRotaPubblica("/accedi")).toBe(true);
    expect(eRotaPubblica("/registrati")).toBe(true);
    expect(eRotaPubblica("/auth/conferma")).toBe(true);
  });

  it("protegge tutto il resto, anche i percorsi che iniziano in modo simile", () => {
    expect(eRotaPubblica("/")).toBe(false);
    expect(eRotaPubblica("/magazzino")).toBe(false);
    expect(eRotaPubblica("/accedi-admin")).toBe(false);
    expect(eRotaPubblica("/benvenuto")).toBe(false);
  });
});
