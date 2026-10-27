"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { richiediAdmin, richiediProfilo } from "@/lib/auth";
import { messaggioErrore } from "@/lib/errori";
import { valoriDa, type StatoAzione } from "@/lib/stato-azione";
import { creaClientServer } from "@/lib/supabase/server";

const testo = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

const schemaProfilo = z.object({
  nome: z.string().min(1, "Scrivi il tuo nome.").max(60, "Il nome è troppo lungo."),
  ruolo_cucina: z.string().max(40, "Il ruolo è troppo lungo."),
});

export async function aggiornaProfilo(_prec: StatoAzione, dati: FormData): Promise<StatoAzione> {
  const valori = valoriDa(dati, ["nome", "ruolo_cucina"]);
  const { utente } = await richiediProfilo();
  const esito = schemaProfilo.safeParse({
    nome: testo(dati.get("nome")),
    ruolo_cucina: testo(dati.get("ruolo_cucina")),
  });
  if (!esito.success) return { errore: esito.error.issues[0].message, valori };

  const supabase = await creaClientServer();
  const { error } = await supabase
    .from("profili")
    .update({ nome: esito.data.nome, ruolo_cucina: esito.data.ruolo_cucina || null })
    .eq("id", utente.id);
  if (error) return { errore: messaggioErrore(error), valori };

  revalidatePath("/profilo");
  return { ok: "Profilo aggiornato." };
}

export async function rigeneraCodice(): Promise<void> {
  await richiediAdmin();
  const supabase = await creaClientServer();
  await supabase.rpc("rigenera_codice_invito");
  revalidatePath("/profilo/team");
}

export async function cambiaRuolo(utenteId: string, ruolo: "admin" | "staff"): Promise<StatoAzione> {
  await richiediAdmin();
  const supabase = await creaClientServer();
  const { error } = await supabase.rpc("imposta_ruolo", { p_utente: utenteId, p_ruolo: ruolo });
  if (error) return { errore: messaggioErrore(error) };
  revalidatePath("/profilo/team");
  return { ok: "Ruolo aggiornato." };
}

export async function rimuoviMembro(utenteId: string): Promise<StatoAzione> {
  await richiediAdmin();
  const supabase = await creaClientServer();
  const { error } = await supabase.rpc("rimuovi_membro", { p_utente: utenteId });
  if (error) return { errore: messaggioErrore(error) };
  revalidatePath("/profilo/team");
  return { ok: "Persona rimossa dal locale." };
}
