import { z } from "zod";
import { schemaAllergene, schemaDataScadenza, schemaUnita } from "@/lib/scadenze/schemi";
import { aggiungiGiorni, dataOggi } from "@/lib/scadenze/stato-scadenza";
import type { Lettura } from "./tipi";

/**
 * Forma che chiediamo al modello (output strutturato). Volutamente semplice: vincoli come
 * "data valida" o "numero positivo" si controllano dopo, in `normalizzaLettura`.
 */
export const schemaModello = z.object({
  nome: z.string().nullable(),
  data_scadenza: z.string().nullable(),
  lotto: z.string().nullable(),
  allergeni: z.array(schemaAllergene),
  quantita: z.number().nullable(),
  unita: schemaUnita.nullable(),
  confidenza: z.object({
    nome: z.number(),
    data_scadenza: z.number(),
    lotto: z.number(),
    allergeni: z.number(),
    quantita: z.number(),
    globale: z.number(),
  }),
});

export type RispostaModello = z.infer<typeof schemaModello>;

const limita01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const pulisci = (testo: string | null, max: number) => {
  const t = (testo ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return t === "" ? null : t;
};

/**
 * Rende affidabile quello che dice il modello: testi ripuliti, data esistente e plausibile,
 * quantità positiva con la sua unità. Un dato che non regge diventa `null` con confidenza 0:
 * meglio chiedere a chi usa l'app che salvare un valore sbagliato.
 */
export function normalizzaLettura(grezza: RispostaModello, adesso: Date): Lettura {
  const c = grezza.confidenza;
  const confidenza = {
    nome: limita01(c.nome),
    data_scadenza: limita01(c.data_scadenza),
    lotto: limita01(c.lotto),
    allergeni: limita01(c.allergeni),
    quantita: limita01(c.quantita),
    globale: limita01(c.globale),
  };

  const nome = pulisci(grezza.nome, 120);
  if (!nome) confidenza.nome = 0;

  // Data: deve esistere ed essere plausibile (da 5 anni fa a 10 anni da oggi).
  let data: string | null = null;
  const candidata = schemaDataScadenza.safeParse(grezza.data_scadenza?.trim() ?? "");
  if (candidata.success) {
    const oggi = dataOggi(adesso);
    if (candidata.data >= aggiungiGiorni(oggi, -5 * 365) && candidata.data <= aggiungiGiorni(oggi, 10 * 365)) {
      data = candidata.data;
    }
  }
  if (!data) confidenza.data_scadenza = 0;

  const lotto = pulisci(grezza.lotto, 60);
  if (!lotto) confidenza.lotto = 0;

  const quantitaValida =
    grezza.quantita !== null && Number.isFinite(grezza.quantita) && grezza.quantita > 0 && grezza.quantita <= 1_000_000;
  const quantita = quantitaValida && grezza.unita ? Math.round(grezza.quantita! * 1000) / 1000 : null;
  const unita = quantita === null ? null : grezza.unita;
  if (quantita === null) confidenza.quantita = 0;

  return {
    nome,
    data_scadenza: data,
    lotto,
    allergeni: [...new Set(grezza.allergeni)],
    quantita,
    unita,
    confidenza,
  };
}

/** Controlla e normalizza la risposta del modello; `null` se non rispetta lo schema. */
export function leggiRispostaModello(grezza: unknown, adesso: Date): Lettura | null {
  const esito = schemaModello.safeParse(grezza);
  return esito.success ? normalizzaLettura(esito.data, adesso) : null;
}
