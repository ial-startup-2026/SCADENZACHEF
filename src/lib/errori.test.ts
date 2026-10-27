import { describe, expect, it } from "vitest";
import { messaggioErrore, messaggioErroreAuth } from "./errori";

describe("messaggioErrore", () => {
  it("traduce i codici delle funzioni del database", () => {
    expect(messaggioErrore({ message: "codice_non_valido" })).toMatch(/Codice non valido/);
    expect(messaggioErrore({ message: "ultimo_admin" })).toMatch(/almeno un Admin/);
  });

  it("riconosce il codice anche dentro un messaggio più lungo", () => {
    expect(messaggioErrore({ message: 'P0001: prodotto_non_attivo (context)' })).toMatch(/già stato scaricato/);
  });

  it("non mostra mai testo tecnico: usa un messaggio generico", () => {
    expect(messaggioErrore({ message: "duplicate key value violates unique constraint" })).toMatch(/Riprova/);
    expect(messaggioErrore(null)).toMatch(/Riprova/);
  });
});

describe("messaggioErroreAuth", () => {
  it("traduce gli errori di accesso più comuni", () => {
    expect(messaggioErroreAuth({ code: "invalid_credentials" })).toBe("Email o password non corrette.");
    expect(messaggioErroreAuth({ message: "User already registered" })).toMatch(/Esiste già un account/);
    expect(messaggioErroreAuth({ code: "weak_password" })).toMatch(/8 caratteri/);
  });

  it("ha un messaggio di riserva", () => {
    expect(messaggioErroreAuth({ message: "boh" })).toMatch(/Riprova/);
  });
});
