import type { Lettura, MotivoFallimento, EsitoLettura } from "./tipi";
import { leggiRispostaModello } from "./schema";

/** Un errore della chiamata al modello che sappiamo spiegare con un motivo preciso. */
export class ErroreLettura extends Error {
  constructor(readonly motivo: MotivoFallimento) {
    super(motivo);
  }
}

export type RispostaGrezza = {
  /** Quello che il modello ha restituito, già come oggetto (o `null` se non era JSON valido). */
  parsed: unknown;
  rifiutata?: boolean;
};

/** Una chiamata al modello. `tentativo` parte da 1: dal secondo il prompt chiede di rispettare lo schema. */
export type Chiamata = (tentativo: number) => Promise<RispostaGrezza>;

const TENTATIVI = 2;

/**
 * Legge un'etichetta: se la risposta non è valida riprova una volta, poi si arrende e la schermata
 * passa all'inserimento a mano. Gli errori della chiamata non si ripetono qui (l'SDK ritenta già
 * da solo i problemi di rete): si trasformano in un motivo da mostrare.
 */
export async function leggiEtichetta(chiama: Chiamata, adesso: Date): Promise<EsitoLettura> {
  for (let tentativo = 1; tentativo <= TENTATIVI; tentativo++) {
    let risposta: RispostaGrezza;
    try {
      risposta = await chiama(tentativo);
    } catch (e) {
      return { ok: false, motivo: e instanceof ErroreLettura ? e.motivo : "errore" };
    }
    if (risposta.rifiutata) return { ok: false, motivo: "rifiutata" };

    const lettura: Lettura | null = leggiRispostaModello(risposta.parsed, adesso);
    if (lettura) return { ok: true, lettura, origine: "ai" };
  }
  return { ok: false, motivo: "risposta_non_valida" };
}
