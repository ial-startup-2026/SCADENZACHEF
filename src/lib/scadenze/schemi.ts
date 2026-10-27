import { z } from "zod";
import { ALLERGENI, type CodiceAllergene } from "@/lib/costanti/allergeni";
import { CATEGORIE, type CodiceCategoria } from "@/lib/costanti/categorie";
import { MOTIVI_SPRECO, type CodiceMotivoSpreco } from "@/lib/costanti/motivi-spreco";
import { POSIZIONI, type CodicePosizione } from "@/lib/costanti/posizioni";
import { UNITA, type CodiceUnita } from "@/lib/costanti/unita";
import { giorniAllaScadenza } from "./stato-scadenza";

function daCodici<T extends string>(voci: readonly { codice: T }[]) {
  return z.enum(voci.map((v) => v.codice) as [T, ...T[]]);
}

export const schemaCategoria = daCodici<CodiceCategoria>(CATEGORIE);
export const schemaPosizione = daCodici<CodicePosizione>(POSIZIONI);
export const schemaUnita = daCodici<CodiceUnita>(UNITA);
export const schemaAllergene = daCodici<CodiceAllergene>(ALLERGENI);
export const schemaMotivo = daCodici<CodiceMotivoSpreco>(MOTIVI_SPRECO);

/** Data `YYYY-MM-DD` che esiste davvero e ha un anno sensato (evita refusi come 2062). */
export const schemaDataScadenza = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Scegli una data valida.")
  .refine((d) => {
    try {
      giorniAllaScadenza(d, new Date());
      const anno = Number(d.slice(0, 4));
      return anno >= 2020 && anno <= 2100;
    } catch {
      return false;
    }
  }, "Scegli una data valida.");

/** Scarico ("usato") o spreco ("buttato"). `quantita: null` = tutto il rimasto. */
export const schemaScarico = z
  .object({
    clientUuid: z.uuid(),
    prodottoId: z.uuid(),
    tipo: z.enum(["scarico", "spreco"]),
    quantita: z.number().positive("La quantità deve essere maggiore di zero.").max(1_000_000).nullable(),
    motivo: schemaMotivo.nullable(),
  })
  .refine((v) => v.tipo !== "spreco" || v.motivo !== null, {
    message: "Indica perché lo butti.",
    path: ["motivo"],
  });

export type InputScarico = z.infer<typeof schemaScarico>;

export const schemaModificaProdotto = z.object({
  nome: z.string().trim().min(1, "Scrivi il nome del prodotto.").max(120, "Il nome è troppo lungo."),
  categoria: schemaCategoria,
  posizione: schemaPosizione,
  unita: schemaUnita,
  data_scadenza: schemaDataScadenza,
  lotto: z
    .string()
    .trim()
    .max(60, "Il lotto è troppo lungo.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  allergeni: z.array(schemaAllergene).max(ALLERGENI.length).transform((a) => [...new Set(a)]),
});

export type InputModificaProdotto = z.input<typeof schemaModificaProdotto>;
export type DatiModificaProdotto = z.output<typeof schemaModificaProdotto>;

/** Prodotto nuovo (dalla scansione o a mano). `clientUuid` rende l'invio ripetibile senza doppioni. */
export const schemaNuovoProdotto = schemaModificaProdotto.extend({
  clientUuid: z.uuid(),
  quantita: z.number().positive("La quantità deve essere maggiore di zero.").max(1_000_000, "La quantità è troppo grande."),
  fotoPath: z.string().max(200).nullable(),
});

export type DatiNuovoProdotto = z.output<typeof schemaNuovoProdotto>;
