"use server";

import { revalidatePath } from "next/cache";
import { richiediProfilo } from "@/lib/auth";
import { archivioDemo } from "@/lib/demo/archivio";
import { modalitaDemo } from "@/lib/demo/modalita";
import { registraSu } from "@/lib/demo/operazioni";
import { messaggioErrore } from "@/lib/errori";
import type { EsitoRegistrazione } from "@/lib/scadenze/esiti";
import { schemaNuovoProdotto } from "@/lib/scadenze/schemi";
import { creaClientServer } from "@/lib/supabase/server";

/** Registra un prodotto nuovo (da scansione o a mano). Idempotente su `clientUuid`. */
export async function registraProdotto(input: unknown): Promise<EsitoRegistrazione> {
  const { profilo } = await richiediProfilo();
  const esito = schemaNuovoProdotto.safeParse(input);
  if (!esito.success) return { ok: false, errore: esito.error.issues[0]?.message ?? "Dati non validi." };
  const v = esito.data;

  // La foto deve stare nella cartella del proprio locale (lo controlla anche il database).
  if (v.fotoPath && !v.fotoPath.startsWith(`${profilo.locale_id}/`)) {
    return { ok: false, errore: "La foto non è valida." };
  }

  if (modalitaDemo()) {
    const demo = registraSu(archivioDemo(), v);
    revalidatePath("/");
    revalidatePath("/magazzino");
    return demo;
  }

  const supabase = await creaClientServer();
  const { data, error } = await supabase.rpc("registra_prodotto", {
    p_client_uuid: v.clientUuid,
    p_nome: v.nome,
    p_categoria: v.categoria,
    p_posizione: v.posizione,
    p_quantita: v.quantita,
    p_unita: v.unita,
    p_data_scadenza: v.data_scadenza,
    p_lotto: v.lotto,
    p_allergeni: v.allergeni,
    p_foto_etichetta: v.fotoPath,
  });
  if (error) return { ok: false, errore: messaggioErrore(error) };

  revalidatePath("/");
  revalidatePath("/magazzino");
  return { ok: true, prodottoId: data as string, ripetuto: false };
}
