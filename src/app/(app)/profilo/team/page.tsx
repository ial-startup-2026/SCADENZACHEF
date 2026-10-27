import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { richiediAdmin } from "@/lib/auth";
import { urlFotoProfilo } from "@/lib/foto-profilo";
import { creaClientServer } from "@/lib/supabase/server";
import type { Profilo } from "@/lib/supabase/tipi";
import { cn } from "@/lib/utils";
import { rigeneraCodice } from "../azioni";
import { CondividiInvito } from "./condividi-invito";
import { RigaMembro } from "./riga-membro";

export const metadata: Metadata = { title: "Squadra" };

export default async function TeamPage() {
  const { profilo, locale } = await richiediAdmin();
  const supabase = await creaClientServer();

  const [{ data: codice }, { data: membri }, intestazioni] = await Promise.all([
    supabase.rpc("leggi_codice_invito"),
    supabase
      .from("profili")
      .select("id, locale_id, nome, ruolo_cucina, ruolo, foto_url")
      .order("nome")
      .returns<Profilo[]>(),
    headers(),
  ]);

  const host = intestazioni.get("x-forwarded-host") ?? intestazioni.get("host") ?? "";
  const protocollo = intestazioni.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const link = `${protocollo}://${host}/benvenuto?codice=${codice ?? ""}`;

  const foto = await Promise.all((membri ?? []).map((m) => urlFotoProfilo(supabase, m.foto_url)));

  return (
    <>
      <Link href="/profilo" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 mb-2")}>
        <ChevronLeft aria-hidden />
        Profilo
      </Link>
      <IntestazionePagina titolo="Squadra" sottotitolo={locale.nome} />

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold">Invita qualcuno</h2>
        <p className="text-muted-foreground">Chi si registra può entrare nel locale con questo codice, o aprendo il link.</p>
        {codice ? (
          <CondividiInvito codice={codice} link={link} nomeLocale={locale.nome} />
        ) : (
          <p role="alert" className="font-semibold text-destructive">Non riesco a leggere il codice. Riprova.</p>
        )}
        <form action={rigeneraCodice} className="pt-2">
          <Button type="submit" variant="ghost" className="w-full">
            <RefreshCw aria-hidden />
            Genera un nuovo codice
          </Button>
          <p className="mt-1 text-center text-sm text-muted-foreground">Il codice attuale smetterà di funzionare.</p>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Chi c&apos;è in squadra</h2>
        <ul className="space-y-3">
          {(membri ?? []).map((m, i) => (
            <RigaMembro
              key={m.id}
              id={m.id}
              nome={m.nome}
              ruoloCucina={m.ruolo_cucina}
              ruolo={m.ruolo}
              urlFoto={foto[i]}
              sonoIo={m.id === profilo.id}
            />
          ))}
        </ul>
      </section>
    </>
  );
}
