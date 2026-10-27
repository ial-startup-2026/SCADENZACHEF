import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODELLO_SCAN_DEFAULT, SCAN } from "@/config/app";
import { dataOggi } from "@/lib/scadenze/stato-scadenza";
import { ErroreLettura, type Chiamata } from "./leggi";
import { PROMPT_UTENTE, PROMPT_UTENTE_RIPROVA, promptSistema } from "./prompt";
import { schemaModello } from "./schema";

export type TipoImmagine = "image/jpeg" | "image/png" | "image/webp";
export type ImmagineBase64 = { dati: string; tipo: TipoImmagine };

/** Traduce un errore dell'SDK in un motivo da mostrare; i dettagli restano nel log del server. */
function motivoDaErrore(e: unknown) {
  if (e instanceof Anthropic.RateLimitError) return "occupato" as const;
  if (e instanceof Anthropic.APIError) {
    console.error(`[scan] errore del servizio di lettura (${e.status}): ${e.message}`);
    return "errore" as const;
  }
  console.error("[scan] errore imprevisto", e);
  return "errore" as const;
}

/**
 * Il JSON restituito dal modello, o `null` se manca, è troncato (`max_tokens`) o non è JSON.
 * Si legge a mano invece di usare `messages.parse`, che in caso di risposta non conforme lancia un
 * errore: qui una risposta non valida deve poter far partire il secondo tentativo.
 */
function estraiJson(risposta: Anthropic.Message): unknown {
  if (risposta.stop_reason === "max_tokens") return null;
  const testo = risposta.content.find((b) => b.type === "text");
  if (!testo || testo.type !== "text") return null;
  try {
    return JSON.parse(testo.text);
  } catch {
    return null;
  }
}

/**
 * Chiamata al modello con output strutturato; la risposta viene poi validata con Zod (`leggiEtichetta`).
 * Il client si può passare da fuori: i test lo puntano a un server finto.
 */
export function creaChiamataAnthropic(
  immagine: ImmagineBase64,
  opzioni: { client?: Anthropic; modello?: string; adesso?: Date } = {},
): Chiamata {
  const client = opzioni.client ?? new Anthropic();
  const modello = opzioni.modello ?? process.env.ANTHROPIC_MODEL ?? MODELLO_SCAN_DEFAULT;
  const oggi = dataOggi(opzioni.adesso ?? new Date());

  return async (tentativo) => {
    try {
      const risposta = await client.messages.create(
        {
          model: modello,
          max_tokens: 1024,
          // Estrazione di dati: poco ragionamento basta e tiene la risposta veloce.
          output_config: { effort: "low", format: zodOutputFormat(schemaModello) },
          system: promptSistema(oggi),
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: immagine.tipo, data: immagine.dati } },
                { type: "text", text: tentativo > 1 ? PROMPT_UTENTE_RIPROVA : PROMPT_UTENTE },
              ],
            },
          ],
        },
        { timeout: SCAN.timeoutMs, maxRetries: 1 },
      );
      if (risposta.stop_reason === "refusal") return { parsed: null, rifiutata: true };
      return { parsed: estraiJson(risposta) };
    } catch (e) {
      throw new ErroreLettura(motivoDaErrore(e));
    }
  };
}
