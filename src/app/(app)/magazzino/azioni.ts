"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { richiediProfilo } from "@/lib/auth";
import { archivioDemo } from "@/lib/demo/archivio";
import { modalitaDemo } from "@/lib/demo/modalita";
import { annullaSu, modificaSu, scaricaSu } from "@/lib/demo/operazioni";
import { messaggioErrore } from "@/lib/errori";
import type { EsitoAnnulla, EsitoModifica, EsitoScarico, StatoProdotto } from "@/lib/scadenze/esiti";
import { schemaModificaProdotto, schemaScarico } from "@/lib/scadenze/schemi";
import { creaClientServer } from "@/lib/supabase/server";
import { COLONNE_PRODOTTO, type ProdottoMagazzino } from "@/lib/supabase/tipi";

const primoErrore = (e: z.ZodError) => e.issues[0]?.message ?? "Dati non validi.";

function aggiornaPagine() {
  revalidatePath("/");
  revalidatePath("/magazzino");
}

/** "Usato" (scarico) o "Buttato" (spreco, con motivo). Idempotente su `clientUuid`. */
export async function scaricaProdotto(input: unknown): Promise<EsitoScarico> {
  await richiediProfilo();
  const esito = schemaScarico.safeParse(input);
  if (!esito.success) return { ok: false, errore: primoErrore(esito.error) };
  const v = esito.data;
  if (modalitaDemo()) {
    const esitoDemo = scaricaSu(archivioDemo(), v);
    if (esitoDemo.ok) aggiornaPagine();
    return esitoDemo;
  }

  const supabase = await creaClientServer();
  const { data, error } = await supabase.rpc("scarica_prodotto", {
    p_client_uuid: v.clientUuid,
    p_prodotto_id: v.prodottoId,
    p_tipo: v.tipo,
    p_quantita: v.quantita,
    p_motivo: v.motivo,
  });
  if (error) return { ok: false, errore: messaggioErrore(error) };

  const r = data as { movimento_id: string; quantita: number; stato: StatoProdotto };
  aggiornaPagine();
  return { ok: true, movimentoId: r.movimento_id, quantita: Number(r.quantita), stato: r.stato };
}

/** "Annulla" dopo uno scarico o uno spreco: la quantità torna sul prodotto. */
export async function annullaMovimento(movimentoId: string): Promise<EsitoAnnulla> {
  await richiediProfilo();
  const id = z.uuid().safeParse(movimentoId);
  if (!id.success) return { ok: false, errore: "Movimento non valido." };
  if (modalitaDemo()) {
    const esitoDemo = annullaSu(archivioDemo(), id.data);
    if (esitoDemo.ok) aggiornaPagine();
    return esitoDemo;
  }

  const supabase = await creaClientServer();
  const { data, error } = await supabase.rpc("annulla_movimento", { p_movimento_id: id.data });
  if (error) return { ok: false, errore: messaggioErrore(error) };

  const r = data as { quantita: number; stato: StatoProdotto };
  aggiornaPagine();
  return { ok: true, quantita: Number(r.quantita), stato: r.stato };
}

/** Modifica dei dati descrittivi (non quantità né stato: quelli passano da scarico/annulla). */
export async function modificaProdotto(prodottoId: string, input: unknown): Promise<EsitoModifica> {
  await richiediProfilo();
  const id = z.uuid().safeParse(prodottoId);
  if (!id.success) return { ok: false, errore: "Prodotto non valido." };
  const esito = schemaModificaProdotto.safeParse(input);
  if (!esito.success) return { ok: false, errore: primoErrore(esito.error) };
  if (modalitaDemo()) {
    const esitoDemo = modificaSu(archivioDemo(), id.data, esito.data);
    if (esitoDemo.ok) aggiornaPagine();
    return esitoDemo;
  }

  const supabase = await creaClientServer();
  const { data, error } = await supabase
    .from("prodotti_magazzino")
    .update(esito.data)
    .eq("id", id.data)
    .select(COLONNE_PRODOTTO)
    .maybeSingle<ProdottoMagazzino>();
  if (error) return { ok: false, errore: messaggioErrore(error) };
  if (!data) return { ok: false, errore: "Prodotto non trovato." };

  aggiornaPagine();
  return { ok: true, prodotto: { ...data, quantita: Number(data.quantita) } };
}
