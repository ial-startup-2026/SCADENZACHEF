import { cache } from "react";
import { redirect } from "next/navigation";
import { creaClientServer } from "@/lib/supabase/server";
import type { Locale, Profilo } from "@/lib/supabase/tipi";

/** Utente collegato, verificato dal server Auth (non solo dal cookie). Una volta per richiesta. */
export const utenteCorrente = cache(async () => {
  const supabase = await creaClientServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/** Profilo e locale dell'utente collegato, o null se non ha ancora un locale. */
export const profiloCorrente = cache(async () => {
  const utente = await utenteCorrente();
  if (!utente) return null;
  const supabase = await creaClientServer();
  const { data: profilo } = await supabase
    .from("profili")
    .select("id, locale_id, nome, ruolo_cucina, ruolo, foto_url")
    .eq("id", utente.id)
    .maybeSingle<Profilo>();
  if (!profilo) return null;
  const { data: locale } = await supabase
    .from("locali")
    .select("id, nome")
    .eq("id", profilo.locale_id)
    .single<Locale>();
  return { utente, profilo, locale: locale ?? { id: profilo.locale_id, nome: "" } };
});

/** Per le pagine dell'app: serve essere collegati e far parte di un locale. */
export async function richiediProfilo() {
  const utente = await utenteCorrente();
  if (!utente) redirect("/accedi");
  const dati = await profiloCorrente();
  if (!dati) redirect("/benvenuto");
  return dati;
}

/** Per le pagine riservate all'Admin. */
export async function richiediAdmin() {
  const dati = await richiediProfilo();
  if (dati.profilo.ruolo !== "admin") redirect("/profilo");
  return dati;
}
