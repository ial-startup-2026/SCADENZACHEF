"use server";

import { revalidatePath } from "next/cache";
import { richiediAdmin } from "@/lib/auth";
import { messaggioErrore } from "@/lib/errori";
import { schemaSoglie } from "@/lib/scadenze/soglie";
import { creaClientServer } from "@/lib/supabase/server";

export type EsitoSoglie = { ok: true } | { ok: false; errore: string };

/** Solo l'Admin (lo controllano questa funzione e la RLS del database). */
export async function salvaSoglie(input: { giallo: number; arancione: number }): Promise<EsitoSoglie> {
  const { profilo } = await richiediAdmin();
  const esito = schemaSoglie.safeParse(input);
  if (!esito.success) return { ok: false, errore: esito.error.issues[0].message };

  const supabase = await creaClientServer();
  const { data, error } = await supabase
    .from("impostazioni_locale")
    .update({ soglia_giallo: esito.data.giallo, soglia_arancione: esito.data.arancione })
    .eq("locale_id", profilo.locale_id)
    .select("locale_id");
  if (error) return { ok: false, errore: messaggioErrore(error) };
  if (!data || data.length === 0) return { ok: false, errore: "Non ho potuto salvare le soglie." };

  revalidatePath("/", "layout");
  return { ok: true };
}
