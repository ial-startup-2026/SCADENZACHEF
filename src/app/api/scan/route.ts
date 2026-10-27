import { MODELLO_SCAN_DEFAULT, SCAN } from "@/config/app";
import { utenteCorrente } from "@/lib/auth";
import { modalitaDemo } from "@/lib/demo/modalita";
import { creaChiamataAnthropic, type TipoImmagine } from "@/lib/scan/anthropic";
import { leggiEtichetta } from "@/lib/scan/leggi";
import { creaLimitatore } from "@/lib/scan/limite";
import { prossimaLetturaDiProva } from "@/lib/scan/mock";
import type { EsitoLettura, MotivoFallimento } from "@/lib/scan/tipi";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIPI_AMMESSI: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

// Sopravvive alle ricompilazioni a caldo del server di sviluppo.
const globale = globalThis as typeof globalThis & { __limitatoreScan?: ReturnType<typeof creaLimitatore> };
const limitatore = () => (globale.__limitatoreScan ??= creaLimitatore(SCAN.maxRichieste, SCAN.finestraMs));

const STATO_HTTP: Partial<Record<MotivoFallimento, number>> = {
  non_autenticato: 401,
  immagine_non_valida: 400,
  troppe_richieste: 429,
};

const rifiuta = (motivo: MotivoFallimento) => Response.json({ ok: false, motivo } satisfies EsitoLettura, { status: STATO_HTTP[motivo] ?? 200 });

/**
 * Lettura di un'etichetta: riceve la foto (già ridotta dal browser), la fa leggere al modello e
 * restituisce i dati o un motivo per cui non è riuscita. La chiave del servizio resta qui, sul server.
 *
 * Senza chiave: con SCAN_MOCK=1 (o in modalità demo) risponde con letture di prova; altrimenti dice
 * "non_configurato" e la schermata passa all'inserimento a mano.
 */
export async function POST(request: Request): Promise<Response> {
  const utente = await utenteCorrente();
  if (!utente) return rifiuta("non_autenticato");
  if (!limitatore().consuma(utente.id)) return rifiuta("troppe_richieste");

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("immagine");
  } catch {
    return rifiuta("immagine_non_valida");
  }
  if (!(file instanceof Blob) || !TIPI_AMMESSI.includes(file.type) || file.size === 0 || file.size > SCAN.maxByte) {
    return rifiuta("immagine_non_valida");
  }

  const haChiave = Boolean(process.env.ANTHROPIC_API_KEY);
  const prova = process.env.SCAN_MOCK === "1" || (modalitaDemo() && !haChiave);
  if (prova) return Response.json(prossimaLetturaDiProva(new Date()));
  if (!haChiave) return rifiuta("non_configurato");

  const dati = Buffer.from(await file.arrayBuffer()).toString("base64");
  const esito = await leggiEtichetta(
    creaChiamataAnthropic({ dati, tipo: file.type as TipoImmagine }, { modello: process.env.ANTHROPIC_MODEL ?? MODELLO_SCAN_DEFAULT }),
    new Date(),
  );
  return Response.json(esito);
}
