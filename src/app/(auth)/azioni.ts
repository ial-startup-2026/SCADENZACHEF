"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { messaggioErroreAuth } from "@/lib/errori";
import { percorsoSicuro } from "@/lib/percorsi";
import { valoriDa, type StatoAzione } from "@/lib/stato-azione";
import { creaClientServer } from "@/lib/supabase/server";

const testo = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const schemaAccesso = z.object({
  email: z.email("Scrivi un'email valida."),
  password: z.string().min(1, "Scrivi la password."),
});

export async function accedi(_prec: StatoAzione, dati: FormData): Promise<StatoAzione> {
  const valori = valoriDa(dati, ["email"]);
  const esito = schemaAccesso.safeParse({
    email: testo(dati.get("email")).trim(),
    password: testo(dati.get("password")),
  });
  if (!esito.success) return { errore: esito.error.issues[0].message, valori };

  const supabase = await creaClientServer();
  const { error } = await supabase.auth.signInWithPassword(esito.data);
  if (error) return { errore: messaggioErroreAuth(error), valori };

  redirect(percorsoSicuro(testo(dati.get("next"))));
}

const schemaRegistrazione = z.object({
  email: z.email("Scrivi un'email valida."),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri."),
});

export async function registrati(_prec: StatoAzione, dati: FormData): Promise<StatoAzione> {
  const valori = valoriDa(dati, ["email"]);
  const esito = schemaRegistrazione.safeParse({
    email: testo(dati.get("email")).trim(),
    password: testo(dati.get("password")),
  });
  if (!esito.success) return { errore: esito.error.issues[0].message, valori };

  const next = percorsoSicuro(testo(dati.get("next")));
  const intestazioni = await headers();
  const origine = intestazioni.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const supabase = await creaClientServer();
  const { data, error } = await supabase.auth.signUp({
    ...esito.data,
    options: { emailRedirectTo: `${origine}/auth/conferma?next=${encodeURIComponent(next)}` },
  });
  if (error) return { errore: messaggioErroreAuth(error), valori };
  // Con la conferma email attiva Supabase non segnala gli indirizzi già registrati: lo si capisce così.
  if (data.user && data.user.identities?.length === 0) {
    return { errore: messaggioErroreAuth({ code: "user_already_exists" }), valori };
  }
  if (!data.session) {
    return { ok: "Ti abbiamo scritto: apri il link nell'email per confermare, poi accedi." };
  }
  redirect(next);
}

export async function esci() {
  const supabase = await creaClientServer();
  await supabase.auth.signOut();
  redirect("/accedi");
}
