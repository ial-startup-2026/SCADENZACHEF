import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const utente = vi.hoisted(() => ({ corrente: { id: "utente-1" } as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ utenteCorrente: async () => utente.corrente }));

import { POST } from "./route";

const foto = (tipo = "image/jpeg", byte = 100) => new File([new Uint8Array(byte)], "etichetta.jpg", { type: tipo });
const richiesta = (file: Blob | null = foto()) => {
  const corpo = new FormData();
  if (file) corpo.append("immagine", file);
  return new Request("http://localhost/api/scan", { method: "POST", body: corpo });
};

beforeEach(() => {
  utente.corrente = { id: `utente-${Math.random()}` }; // un utente nuovo a ogni test: il limite non interferisce
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("SCAN_MOCK", "");
  vi.stubEnv("MODALITA_DEMO", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/scan", () => {
  it("senza login risponde 401", async () => {
    utente.corrente = null;
    const r = await POST(richiesta());
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ ok: false, motivo: "non_autenticato" });
  });

  it("rifiuta foto mancanti, di tipo sbagliato, vuote o troppo grandi", async () => {
    for (const file of [null, foto("application/pdf"), foto("image/jpeg", 0), foto("image/jpeg", 4_000_001)]) {
      const r = await POST(richiesta(file));
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ ok: false, motivo: "immagine_non_valida" });
    }
  });

  it("senza chiave e senza modalità prova dice 'non configurato' (si passa all'inserimento a mano)", async () => {
    const r = await POST(richiesta());
    expect(await r.json()).toEqual({ ok: false, motivo: "non_configurato" });
  });

  it("con SCAN_MOCK=1 restituisce letture di prova, anche senza chiave", async () => {
    vi.stubEnv("SCAN_MOCK", "1");
    const r = await POST(richiesta());
    expect(r.status).toBe(200);
    const j = await r.json();
    // Le letture di prova ruotano: una è volutamente fallita (per provare l'inserimento a mano).
    expect(j.ok ? j.origine : j.motivo).toMatch(/^(prova|risposta_non_valida)$/);
  });

  it("in modalità demo senza chiave usa le letture di prova", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MODALITA_DEMO", "1");
    const j = await (await POST(richiesta())).json();
    expect(j.ok === false ? j.motivo : j.origine).toMatch(/risposta_non_valida|prova/);
  });

  it("in produzione la modalità demo non basta: senza chiave non legge", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MODALITA_DEMO", "1");
    expect(await (await POST(richiesta())).json()).toEqual({ ok: false, motivo: "non_configurato" });
  });

  it("limita le richieste per utente", async () => {
    vi.stubEnv("SCAN_MOCK", "1");
    const id = utente.corrente!.id;
    let ultimo = 200;
    for (let i = 0; i < 40; i++) {
      utente.corrente = { id };
      ultimo = (await POST(richiesta())).status;
      if (ultimo === 429) break;
    }
    expect(ultimo).toBe(429);
    utente.corrente = { id: "un-altro-utente" };
    expect((await POST(richiesta())).status).toBe(200);
  });
});
