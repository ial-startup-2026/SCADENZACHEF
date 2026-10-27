"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { messaggioErrore } from "@/lib/errori";
import { valoriDa, type StatoAzione } from "@/lib/stato-azione";
import { creaClientServer } from "@/lib/supabase/server";

const testo = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

const persona = {
  nome: z.string().min(1, "Scrivi il tuo nome.").max(60, "Il nome è troppo lungo."),
  ruolo_cucina: z.string().max(40, "Il ruolo è troppo lungo."),
};

const schemaCrea = z.object({
  ...persona,
  nome_locale: z.string().min(1, "Scrivi il nome del locale.").max(80, "Il nome del locale è troppo lungo."),
});

const schemaEntra = z.object({
  ...persona,
  codice: z.string().min(4, "Scrivi il codice che ti ha dato il titolare.").max(12, "Il codice non è valido."),
});

export async function creaLocale(_prec: StatoAzione, dati: FormData): Promise<StatoAzione> {
  const valori = valoriDa(dati, ["nome_locale", "nome", "ruolo_cucina"]);
  const esito = schemaCrea.safeParse({
    nome: testo(dati.get("nome")),
    ruolo_cucina: testo(dati.get("ruolo_cucina")),
    nome_locale: testo(dati.get("nome_locale")),
  });
  if (!esito.success) return { errore: esito.error.issues[0].message, valori };

  const supabase = await creaClientServer();
  const { error } = await supabase.rpc("crea_locale", {
    p_nome_locale: esito.data.nome_locale,
    p_nome: esito.data.nome,
    p_ruolo_cucina: esito.data.ruolo_cucina || null,
  });
  if (error) return { errore: messaggioErrore(error), valori };
  redirect("/");
}

export async function entraNelLocale(_prec: StatoAzione, dati: FormData): Promise<StatoAzione> {
  const valori = valoriDa(dati, ["codice", "nome", "ruolo_cucina"]);
  const esito = schemaEntra.safeParse({
    nome: testo(dati.get("nome")),
    ruolo_cucina: testo(dati.get("ruolo_cucina")),
    codice: testo(dati.get("codice")),
  });
  if (!esito.success) return { errore: esito.error.issues[0].message, valori };

  const supabase = await creaClientServer();
  const { error } = await supabase.rpc("unisciti_al_locale", {
    p_codice: esito.data.codice,
    p_nome: esito.data.nome,
    p_ruolo_cucina: esito.data.ruolo_cucina || null,
  });
  if (error) return { errore: messaggioErrore(error), valori };
  redirect("/");
}
