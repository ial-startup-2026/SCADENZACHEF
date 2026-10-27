import { z } from "zod";

/** Soglie del semaforo, in giorni. Configurabili dall'Admin (vedi `impostazioni_locale`). */
export type Soglie = {
  /** Da qui in giù (incluso) lo stato è "In scadenza". Oltre: "OK". */
  giallo: number;
  /** Da qui in giù (incluso, fino a 1 giorno) lo stato è "Attenzione". */
  arancione: number;
};

export const SOGLIE_DEFAULT: Soglie = { giallo: 7, arancione: 3 };

/** Stessi vincoli del CHECK su `impostazioni_locale`. */
export const schemaSoglie = z
  .object({
    giallo: z.number().int("Usa numeri interi.").max(60, "Al massimo 60 giorni."),
    arancione: z.number().int("Usa numeri interi.").min(1, "Almeno 1 giorno."),
  })
  .refine((s) => s.giallo > s.arancione, {
    message: "La soglia gialla deve essere maggiore di quella arancione.",
    path: ["giallo"],
  });

/** Intervalli di giorni di ogni stato, per spiegarli a chi imposta le soglie. */
export function descriviSoglie({ giallo, arancione }: Soglie) {
  return {
    ok: `oltre ${giallo} giorni`,
    "in-scadenza": `da ${giallo} a ${arancione + 1} giorni`,
    attenzione: arancione === 1 ? "1 giorno" : `da ${arancione} a 1 giorni`,
    oggi: "il giorno stesso",
    scaduto: "già scaduto",
  } as const;
}
