import { describe, expect, it } from "vitest";
import { descriviSoglie, schemaSoglie, SOGLIE_DEFAULT } from "./soglie";

describe("schemaSoglie", () => {
  it("accetta le soglie di default", () => {
    expect(schemaSoglie.safeParse(SOGLIE_DEFAULT).success).toBe(true);
  });

  it.each([
    [{ giallo: 3, arancione: 3 }, "maggiore"],
    [{ giallo: 2, arancione: 3 }, "maggiore"],
    [{ giallo: 7, arancione: 0 }, "Almeno 1"],
    [{ giallo: 61, arancione: 3 }, "60"],
    [{ giallo: 7.5, arancione: 3 }, "interi"],
  ])("rifiuta %j", (valori, parteDelMessaggio) => {
    const esito = schemaSoglie.safeParse(valori);
    expect(esito.success).toBe(false);
    expect(esito.error?.issues[0].message).toContain(parteDelMessaggio);
  });
});

describe("descriviSoglie", () => {
  it("spiega gli intervalli con i valori di default", () => {
    expect(descriviSoglie(SOGLIE_DEFAULT)).toEqual({
      ok: "oltre 7 giorni",
      "in-scadenza": "da 7 a 4 giorni",
      attenzione: "da 3 a 1 giorni",
      oggi: "il giorno stesso",
      scaduto: "già scaduto",
    });
  });

  it("gestisce arancione = 1", () => {
    expect(descriviSoglie({ giallo: 5, arancione: 1 }).attenzione).toBe("1 giorno");
  });
});
