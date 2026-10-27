import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ALLERGENI } from "@/lib/costanti/allergeni";
import { creaChiamataAnthropic } from "./anthropic";
import { leggiEtichetta } from "./leggi";

// Il servizio vero è sostituito da un piccolo server locale che registra la richiesta e risponde come
// farebbe la Messages API: così si controlla la forma di ciò che inviamo e come leggiamo la risposta.
let server: Server;
let client: Anthropic;
type CorpoRichiesta = {
  model: string;
  system: string;
  messages: { role: string; content: { type: string; source?: unknown }[] }[];
  output_config: { effort: string; format: { type: string; schema: { properties: Record<string, unknown> } } };
  thinking?: { type?: string; budget_tokens?: number };
};
let richieste: { corpo: CorpoRichiesta; intestazioni: Record<string, unknown> }[];
let prossimeRisposte: { stato: number; corpo: unknown }[];

const ADESSO = new Date("2026-10-27T11:00:00Z");
const IMMAGINE = { dati: "aGVsbG8=", tipo: "image/jpeg" as const };

const lettura = {
  nome: "Burrata",
  data_scadenza: "2026-11-02",
  lotto: "L1",
  allergeni: ["latte"],
  quantita: 125,
  unita: "g",
  confidenza: { nome: 0.95, data_scadenza: 0.9, lotto: 0.8, allergeni: 0.9, quantita: 0.9, globale: 0.9 },
};

const messaggio = (testo: string, stopReason = "end_turn") => ({
  stato: 200,
  corpo: {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5-5",
    content: [{ type: "text", text: testo }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  },
});

beforeAll(async () => {
  server = createServer((req, res) => {
    let dati = "";
    req.on("data", (c) => (dati += c));
    req.on("end", () => {
      richieste.push({ corpo: dati ? JSON.parse(dati) : null, intestazioni: req.headers });
      const r = prossimeRisposte.shift() ?? messaggio(JSON.stringify(lettura));
      res.writeHead(r.stato, { "content-type": "application/json" });
      res.end(JSON.stringify(r.corpo));
    });
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as AddressInfo;
  client = new Anthropic({ apiKey: "chiave-finta", baseURL: `http://127.0.0.1:${port}`, maxRetries: 0 });
});

afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

beforeEach(() => {
  richieste = [];
  prossimeRisposte = [];
});

describe("creaChiamataAnthropic", () => {
  it("invia foto e istruzioni nella forma attesa", async () => {
    const chiama = creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO });
    const risposta = await chiama(1);
    expect(risposta.parsed).toMatchObject({ nome: "Burrata", allergeni: ["latte"] });

    const { corpo, intestazioni } = richieste[0];
    expect(corpo.model).toBe("claude-sonnet-5-5");
    expect(String(intestazioni.authorization)).toContain("chiave-finta");
    expect(intestazioni["anthropic-version"]).toBeDefined();

    const [msg] = corpo.messages;
    expect(msg.role).toBe("user");
    expect(msg.content[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "aGVsbG8=" } });

    // Output strutturato (JSON schema) con tutti i campi richiesti
    expect(corpo.output_config.format.type).toBe("json_schema");
    const proprieta = Object.keys(corpo.output_config.format.schema.properties);
    expect(proprieta).toEqual(expect.arrayContaining(["nome", "data_scadenza", "lotto", "allergeni", "quantita", "unita", "confidenza"]));
    expect(corpo.output_config.effort).toBe("low");

    // Istruzioni: oggi, i 14 allergeni
    expect(corpo.system).toContain("2026-10-27");
    for (const a of ALLERGENI) expect(corpo.system).toContain(a.codice);
  });

  it("non invia parametri che i modelli recenti rifiutano (campionamento, uso forzato di strumenti, prefill)", async () => {
    await creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO })(1);
    const { corpo } = richieste[0];
    for (const vietato of ["temperature", "top_p", "top_k", "tool_choice", "tools"]) expect(corpo).not.toHaveProperty(vietato);
    expect(corpo.messages.at(-1)?.role).toBe("user");
    expect(corpo.thinking?.type ?? "adaptive").not.toBe("disabled");
    expect(corpo.thinking?.budget_tokens).toBeUndefined();
  });

  it("al secondo tentativo chiede esplicitamente di rispettare lo schema", async () => {
    await creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO })(2);
    expect(JSON.stringify(richieste[0].corpo.messages)).toContain("non rispettava lo schema");
  });

  it("un rifiuto del modello viene riportato", async () => {
    prossimeRisposte.push(messaggio("{}", "refusal"));
    const risposta = await creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO })(1);
    expect(risposta.rifiutata).toBe(true);
  });
});

describe("lettura completa con il servizio finto", () => {
  it("lettura valida al primo colpo", async () => {
    const esito = await leggiEtichetta(creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO }), ADESSO);
    expect(esito).toMatchObject({ ok: true, origine: "ai", lettura: { nome: "Burrata", data_scadenza: "2026-11-02" } });
    expect(richieste).toHaveLength(1);
  });

  it("testo non-JSON → secondo tentativo → lettura valida", async () => {
    prossimeRisposte.push(messaggio("Ecco i dati: burrata, scade a novembre"));
    const esito = await leggiEtichetta(creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO }), ADESSO);
    expect(esito.ok).toBe(true);
    expect(richieste).toHaveLength(2);
  });

  it("due risposte non valide → inserimento a mano", async () => {
    prossimeRisposte.push(messaggio("boh"), messaggio('{"nome": 5}'));
    const esito = await leggiEtichetta(creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO }), ADESSO);
    expect(esito).toEqual({ ok: false, motivo: "risposta_non_valida" });
    expect(richieste).toHaveLength(2);
  });

  it("limite di richieste del servizio (429) → 'occupato'; l'SDK ritenta una volta, noi non ripetiamo", async () => {
    const limite = { stato: 429, corpo: { type: "error", error: { type: "rate_limit_error", message: "slow down" } } };
    prossimeRisposte.push(limite, limite);
    const esito = await leggiEtichetta(creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO }), ADESSO);
    expect(esito).toEqual({ ok: false, motivo: "occupato" });
    expect(richieste).toHaveLength(2); // la richiesta e il nuovo tentativo dell'SDK, nessun secondo tentativo di lettura
  });

  it("errore del servizio (500) → 'errore'", async () => {
    const guasto = { stato: 500, corpo: { type: "error", error: { type: "api_error", message: "oops" } } };
    prossimeRisposte.push(guasto, guasto);
    const esito = await leggiEtichetta(creaChiamataAnthropic(IMMAGINE, { client, adesso: ADESSO }), ADESSO);
    expect(esito).toEqual({ ok: false, motivo: "errore" });
  });
});
