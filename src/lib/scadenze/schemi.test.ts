import { describe, expect, it } from "vitest";
import { schemaDataScadenza, schemaModificaProdotto, schemaNuovoProdotto, schemaScarico } from "./schemi";

const UUID_A = "3f2b1c9e-8a4d-4e6f-9b1a-2c3d4e5f6a7b";
const UUID_B = "7a1d2c3b-4e5f-4a6b-8c9d-0e1f2a3b4c5d";

describe("schemaScarico", () => {
  const base = { clientUuid: UUID_A, prodottoId: UUID_B, tipo: "scarico", quantita: 2, motivo: null };

  it("accetta uno scarico parziale e uno totale", () => {
    expect(schemaScarico.safeParse(base).success).toBe(true);
    expect(schemaScarico.safeParse({ ...base, quantita: null }).success).toBe(true);
  });

  it("lo spreco richiede il motivo", () => {
    const senza = schemaScarico.safeParse({ ...base, tipo: "spreco" });
    expect(senza.success).toBe(false);
    expect(senza.error?.issues[0].message).toBe("Indica perché lo butti.");
    expect(schemaScarico.safeParse({ ...base, tipo: "spreco", motivo: "scaduto" }).success).toBe(true);
  });

  it.each([0, -1, Number.NaN, Infinity])("rifiuta quantità %s", (quantita) => {
    expect(schemaScarico.safeParse({ ...base, quantita }).success).toBe(false);
  });

  it("rifiuta id non validi, tipi e motivi inventati", () => {
    expect(schemaScarico.safeParse({ ...base, prodottoId: "abc" }).success).toBe(false);
    expect(schemaScarico.safeParse({ ...base, tipo: "carico" }).success).toBe(false);
    expect(schemaScarico.safeParse({ ...base, tipo: "spreco", motivo: "noia" }).success).toBe(false);
  });
});

describe("schemaDataScadenza", () => {
  it.each(["2026-10-27", "2028-02-29", "2099-12-31"])("accetta %s", (d) => {
    expect(schemaDataScadenza.safeParse(d).success).toBe(true);
  });

  it.each(["27/10/2026", "2026-02-30", "2027-02-29", "2026-13-01", "2062-01-01x", "2010-01-01", "2150-01-01", ""])(
    "rifiuta %j",
    (d) => {
      expect(schemaDataScadenza.safeParse(d).success).toBe(false);
    },
  );
});

describe("schemaModificaProdotto", () => {
  const base = {
    nome: "  Burrata  ",
    categoria: "latticini",
    posizione: "cella_frigo",
    unita: "pz",
    data_scadenza: "2026-11-01",
    lotto: "  ",
    allergeni: ["latte", "latte", "uova"],
  };

  it("ripulisce i dati: nome senza spazi, lotto vuoto → null, allergeni senza doppioni", () => {
    const esito = schemaModificaProdotto.parse(base);
    expect(esito.nome).toBe("Burrata");
    expect(esito.lotto).toBeNull();
    expect(esito.allergeni).toEqual(["latte", "uova"]);
  });

  it("rifiuta nome vuoto, valori inventati e allergeni non UE", () => {
    expect(schemaModificaProdotto.safeParse({ ...base, nome: "   " }).success).toBe(false);
    expect(schemaModificaProdotto.safeParse({ ...base, posizione: "garage" }).success).toBe(false);
    expect(schemaModificaProdotto.safeParse({ ...base, allergeni: ["cioccolato"] }).success).toBe(false);
  });
});

describe("schemaNuovoProdotto", () => {
  const base = {
    clientUuid: UUID_A,
    nome: " Burrata ",
    categoria: "latticini",
    posizione: "cella_frigo",
    unita: "pz",
    quantita: 3,
    data_scadenza: "2026-11-01",
    lotto: "",
    allergeni: ["latte"],
    fotoPath: null,
  };

  it("accetta un prodotto valido e lo ripulisce", () => {
    const v = schemaNuovoProdotto.parse(base);
    expect(v).toMatchObject({ nome: "Burrata", lotto: null, quantita: 3 });
  });

  it.each([0, -1, Number.NaN, 2_000_000])("rifiuta la quantità %s", (quantita) => {
    expect(schemaNuovoProdotto.safeParse({ ...base, quantita }).success).toBe(false);
  });

  it("rifiuta id non valido e data inesistente", () => {
    expect(schemaNuovoProdotto.safeParse({ ...base, clientUuid: "x" }).success).toBe(false);
    expect(schemaNuovoProdotto.safeParse({ ...base, data_scadenza: "2026-02-30" }).success).toBe(false);
  });
});
