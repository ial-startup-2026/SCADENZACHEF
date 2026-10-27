import { describe, expect, it, vi } from "vitest";
import { ALLERGENI } from "@/lib/costanti/allergeni";
import { ErroreLettura, leggiEtichetta, type Chiamata } from "./leggi";
import { creaLimitatore } from "./limite";
import { lettureDiProva, prossimaLetturaDiProva } from "./mock";
import { analizzaPreferenze, PREFERENZE_DEFAULT } from "./preferenze";
import { promptSistema } from "./prompt";
import { leggiRispostaModello, normalizzaLettura, type RispostaModello } from "./schema";
import type { Lettura } from "./tipi";
import { valutaLettura } from "./valutazione";

const ADESSO = new Date("2026-10-27T11:00:00Z"); // 27 ottobre 2026, 12:00 a Roma

const risposta = (over: Partial<RispostaModello> = {}): RispostaModello => ({
  nome: "Burrata",
  data_scadenza: "2026-11-02",
  lotto: "L1",
  allergeni: ["latte"],
  quantita: 125,
  unita: "g",
  confidenza: { nome: 0.95, data_scadenza: 0.9, lotto: 0.8, allergeni: 0.9, quantita: 0.9, globale: 0.9 },
  ...over,
});

describe("normalizzaLettura", () => {
  it("lascia passare una lettura buona, ripulendo i testi", () => {
    const l = normalizzaLettura(risposta({ nome: "  Burrata   di  Andria ", lotto: " L1 " }), ADESSO);
    expect(l).toMatchObject({ nome: "Burrata di Andria", lotto: "L1", data_scadenza: "2026-11-02", quantita: 125, unita: "g" });
  });

  it("una data che non esiste o non è plausibile diventa null con confidenza 0", () => {
    for (const data of ["2026-02-30", "12/11/2026", "", "2099-01-01", "2015-01-01"]) {
      const l = normalizzaLettura(risposta({ data_scadenza: data }), ADESSO);
      expect(l.data_scadenza, data).toBeNull();
      expect(l.confidenza.data_scadenza).toBe(0);
    }
    expect(normalizzaLettura(risposta({ data_scadenza: null }), ADESSO).data_scadenza).toBeNull();
  });

  it("una scadenza già passata da poco resta valida (prodotto scaduto da buttare)", () => {
    expect(normalizzaLettura(risposta({ data_scadenza: "2026-10-20" }), ADESSO).data_scadenza).toBe("2026-10-20");
  });

  it("quantità: solo positiva e con unità", () => {
    expect(normalizzaLettura(risposta({ quantita: 0 }), ADESSO).quantita).toBeNull();
    expect(normalizzaLettura(risposta({ quantita: -3 }), ADESSO).quantita).toBeNull();
    const senzaUnita = normalizzaLettura(risposta({ unita: null }), ADESSO);
    expect(senzaUnita.quantita).toBeNull();
    expect(senzaUnita.unita).toBeNull();
    expect(senzaUnita.confidenza.quantita).toBe(0);
  });

  it("nome vuoto → null; confidenze fuori scala vengono riportate tra 0 e 1; allergeni senza doppioni", () => {
    const l = normalizzaLettura(
      risposta({
        nome: "   ",
        allergeni: ["latte", "latte", "uova"],
        confidenza: { nome: 0.9, data_scadenza: 1.7, lotto: -2, allergeni: Number.NaN, quantita: 0.5, globale: 0.5 },
      }),
      ADESSO,
    );
    expect(l.nome).toBeNull();
    expect(l.confidenza).toMatchObject({ nome: 0, data_scadenza: 1, lotto: 0, allergeni: 0 });
    expect(l.allergeni).toEqual(["latte", "uova"]);
  });
});

describe("leggiRispostaModello", () => {
  it("rifiuta risposte che non rispettano lo schema", () => {
    expect(leggiRispostaModello(null, ADESSO)).toBeNull();
    expect(leggiRispostaModello({ nome: "x" }, ADESSO)).toBeNull();
    expect(leggiRispostaModello({ ...risposta(), allergeni: ["cioccolato"] }, ADESSO)).toBeNull();
    expect(leggiRispostaModello({ ...risposta(), unita: "tazze" }, ADESSO)).toBeNull();
    expect(leggiRispostaModello(risposta(), ADESSO)).not.toBeNull();
  });
});

describe("leggiEtichetta (secondo tentativo e fallimenti)", () => {
  const valida = () => ({ parsed: risposta() });

  it("alla prima risposta valida si ferma", async () => {
    const chiama = vi.fn<Chiamata>(async () => valida());
    const esito = await leggiEtichetta(chiama, ADESSO);
    expect(esito).toMatchObject({ ok: true, origine: "ai" });
    expect(chiama).toHaveBeenCalledTimes(1);
  });

  it("se la prima risposta non è valida riprova una volta (e lo segnala al modello)", async () => {
    const chiama = vi.fn<Chiamata>(async (tentativo) => (tentativo === 1 ? { parsed: null } : valida()));
    const esito = await leggiEtichetta(chiama, ADESSO);
    expect(esito.ok).toBe(true);
    expect(chiama.mock.calls.map(([t]) => t)).toEqual([1, 2]);
  });

  it("due risposte non valide → fallimento, senza un terzo tentativo", async () => {
    const chiama = vi.fn<Chiamata>(async () => ({ parsed: { nome: 5 } }));
    expect(await leggiEtichetta(chiama, ADESSO)).toEqual({ ok: false, motivo: "risposta_non_valida" });
    expect(chiama).toHaveBeenCalledTimes(2);
  });

  it("un errore del servizio non si ripete: si spiega con il motivo giusto", async () => {
    const occupato = vi.fn<Chiamata>(async () => {
      throw new ErroreLettura("occupato");
    });
    expect(await leggiEtichetta(occupato, ADESSO)).toEqual({ ok: false, motivo: "occupato" });
    expect(occupato).toHaveBeenCalledTimes(1);

    const imprevisto = vi.fn<Chiamata>(async () => {
      throw new Error("boom");
    });
    expect(await leggiEtichetta(imprevisto, ADESSO)).toEqual({ ok: false, motivo: "errore" });
  });

  it("un rifiuto del modello porta all'inserimento a mano", async () => {
    expect(await leggiEtichetta(async () => ({ parsed: null, rifiutata: true }), ADESSO)).toEqual({ ok: false, motivo: "rifiutata" });
  });
});

describe("valutaLettura", () => {
  const base: Lettura = {
    nome: "Burrata",
    data_scadenza: "2026-11-02",
    lotto: "L1",
    allergeni: ["latte"],
    quantita: 125,
    unita: "g",
    confidenza: { nome: 0.95, data_scadenza: 0.9, lotto: 0.8, allergeni: 0.9, quantita: 0.9, globale: 0.9 },
  };

  it("una lettura sicura non segnala nulla", () => {
    const v = valutaLettura(base);
    expect(v.daControllare.size).toBe(0);
    expect(v.bassaConfidenza).toBe(false);
  });

  it("segnala nome, scadenza e allergeni se mancano o sono dubbi", () => {
    const v = valutaLettura({ ...base, nome: null, data_scadenza: null, confidenza: { ...base.confidenza, allergeni: 0.3 } });
    expect([...v.daControllare].sort()).toEqual(["allergeni", "data_scadenza", "nome"]);
    expect(v.bassaConfidenza).toBe(true);
  });

  it("lotto e quantità assenti non sono un problema; letti con poca sicurezza sì", () => {
    expect(valutaLettura({ ...base, lotto: null, quantita: null, unita: null, confidenza: { ...base.confidenza, lotto: 0, quantita: 0 } }).daControllare.size).toBe(0);
    const v = valutaLettura({ ...base, confidenza: { ...base.confidenza, lotto: 0.4, quantita: 0.5 } });
    expect([...v.daControllare].sort()).toEqual(["lotto", "quantita"]);
    expect(v.bassaConfidenza).toBe(false); // non sono campi importanti
  });

  it("allergeni con lista vuota ma lettura incerta vanno segnalati (non significa 'senza allergeni')", () => {
    const v = valutaLettura({ ...base, allergeni: [], confidenza: { ...base.confidenza, allergeni: 0 } });
    expect(v.daControllare.has("allergeni")).toBe(true);
  });

  it("la confidenza globale bassa basta a dare l'avviso", () => {
    expect(valutaLettura({ ...base, confidenza: { ...base.confidenza, globale: 0.4 } }).bassaConfidenza).toBe(true);
  });
});

describe("promptSistema", () => {
  const testo = promptSistema("2026-10-27");

  it("contiene tutti i 14 allergeni, con il loro codice", () => {
    expect(ALLERGENI).toHaveLength(14);
    for (const a of ALLERGENI) expect(testo).toContain(a.codice);
  });

  it("dà le istruzioni chiave: formati italiani, scadenza ≠ produzione, niente invenzioni, grassetto/maiuscolo", () => {
    expect(testo).toContain("GG/MM/AAAA");
    expect(testo).toContain("12.2026");
    expect(testo).toMatch(/produzione|confezionamento/);
    expect(testo).toMatch(/Non inventare/);
    expect(testo).toMatch(/grassetto/);
    expect(testo).toMatch(/MAIUSCOLO/);
    expect(testo).toMatch(/confidenza/i);
  });

  it("dice al modello di trattare il testo dell'immagine come dati, non come istruzioni", () => {
    expect(testo).toMatch(/mai istruzioni/);
  });

  it("riporta la data di oggi", () => {
    expect(testo).toContain("2026-10-27");
  });
});

describe("letture di prova", () => {
  it("sono tutte valide secondo lo stesso schema usato per le letture vere", () => {
    for (const lettura of lettureDiProva(ADESSO)) {
      if (!lettura) continue;
      const comeRispostaModello = { ...lettura } as RispostaModello;
      expect(normalizzaLettura(comeRispostaModello, ADESSO)).toEqual(lettura);
    }
  });

  it("coprono i casi difficili: data dubbia, allergeni dubbi, lettura fallita", () => {
    const elenco = lettureDiProva(ADESSO);
    expect(elenco.some((l) => l === null)).toBe(true);
    expect(elenco.some((l) => l && valutaLettura(l).daControllare.has("data_scadenza"))).toBe(true);
    expect(elenco.some((l) => l && valutaLettura(l).daControllare.has("allergeni"))).toBe(true);
    expect(elenco.some((l) => l && valutaLettura(l).daControllare.size === 0)).toBe(true);
  });

  it("ruotano e segnano l'origine 'prova'", () => {
    const esiti = Array.from({ length: 6 }, () => prossimaLetturaDiProva(ADESSO));
    expect(esiti.filter((e) => e.ok).every((e) => e.ok && e.origine === "prova")).toBe(true);
    expect(esiti.some((e) => !e.ok)).toBe(true);
  });
});

describe("creaLimitatore", () => {
  it("lascia passare fino al limite e poi blocca, per utente", () => {
    const ora = 0;
    const l = creaLimitatore(3, 1000, () => ora);
    expect([l.consuma("a"), l.consuma("a"), l.consuma("a"), l.consuma("a")]).toEqual([true, true, true, false]);
    expect(l.consuma("b")).toBe(true);
  });

  it("la finestra scorre: dopo il tempo si può riprovare", () => {
    let ora = 0;
    const l = creaLimitatore(2, 1000, () => ora);
    l.consuma("a");
    ora = 400;
    l.consuma("a");
    expect(l.consuma("a")).toBe(false);
    ora = 1001; // la prima richiesta è uscita dalla finestra
    expect(l.consuma("a")).toBe(true);
    expect(l.consuma("a")).toBe(false);
  });
});

describe("analizzaPreferenze", () => {
  it("legge valori validi", () => {
    expect(analizzaPreferenze(JSON.stringify({ posizione: "freezer", categoria: "carne", continua: true }))).toEqual({
      posizione: "freezer",
      categoria: "carne",
      continua: true,
    });
  });

  it("scarta valori sconosciuti, testo rotto e assenza di dati", () => {
    expect(analizzaPreferenze(JSON.stringify({ posizione: "garage", categoria: 5, continua: "sì" }))).toEqual(PREFERENZE_DEFAULT);
    expect(analizzaPreferenze("{rotto")).toEqual(PREFERENZE_DEFAULT);
    expect(analizzaPreferenze(null)).toEqual(PREFERENZE_DEFAULT);
  });
});
