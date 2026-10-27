import { schemaModello } from "./schema";
import { MESSAGGI_FALLIMENTO, type EsitoLettura, type MotivoFallimento } from "./tipi";

/**
 * Legge la risposta di /api/scan nel browser. Non ci si fida a occhi chiusi nemmeno del nostro server
 * (una pagina di errore del proxy, una risposta vuota…): qualunque cosa non quadri diventa "errore".
 */
export function esitoDaRisposta(json: unknown): EsitoLettura {
  if (typeof json !== "object" || json === null) return { ok: false, motivo: "errore" };
  const r = json as Record<string, unknown>;

  if (r.ok === true) {
    const lettura = schemaModello.safeParse(r.lettura);
    if (lettura.success && (r.origine === "ai" || r.origine === "prova")) {
      return { ok: true, lettura: lettura.data, origine: r.origine };
    }
    return { ok: false, motivo: "errore" };
  }
  const motivo = r.motivo;
  return {
    ok: false,
    motivo: typeof motivo === "string" && motivo in MESSAGGI_FALLIMENTO ? (motivo as MotivoFallimento) : "errore",
  };
}

/** Segnale che si ferma quando si annulla la lettura o passa troppo tempo. */
export function segnaleConTempoMassimo(segnale: AbortSignal | undefined, ms: number): AbortSignal {
  const tempo = AbortSignal.timeout(ms);
  if (!segnale) return tempo;
  return typeof AbortSignal.any === "function" ? AbortSignal.any([segnale, tempo]) : segnale;
}
