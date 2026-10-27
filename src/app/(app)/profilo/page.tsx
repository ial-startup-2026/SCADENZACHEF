import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut, Timer, Users } from "lucide-react";
import { APP_NAME } from "@/config/app";
import { Avatar } from "@/components/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Campo } from "@/components/campo";
import { CampoRuoloCucina } from "@/components/campo-ruolo-cucina";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { ModuloAzione } from "@/components/modulo-azione";
import { SelettoreTema } from "@/components/selettore-tema";
import { richiediProfilo } from "@/lib/auth";
import { modalitaDemo } from "@/lib/demo/modalita";
import { urlFotoProfilo } from "@/lib/foto-profilo";
import { creaClientServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { esci } from "../../(auth)/azioni";
import { aggiornaProfilo } from "./azioni";
import { CambiaFotoProfilo } from "./foto-profilo";

export const metadata: Metadata = { title: "Profilo" };

export default async function ProfiloPage() {
  const { profilo, locale } = await richiediProfilo();
  const urlFoto = modalitaDemo() ? null : await urlFotoProfilo(await creaClientServer(), profilo.foto_url);
  const admin = profilo.ruolo === "admin";

  return (
    <>
      <IntestazionePagina titolo="Profilo" />

      <section className="mb-8 flex items-center gap-4">
        <Avatar nome={profilo.nome} url={urlFoto} className="size-20 text-2xl" />
        <div className="min-w-0 space-y-2">
          <p className="truncate text-xl font-bold">{profilo.nome}</p>
          <p className="text-muted-foreground">
            {admin ? "Admin" : "Staff"} · {locale.nome}
          </p>
          <CambiaFotoProfilo utenteId={profilo.id} localeId={profilo.locale_id} nonDisponibile={modalitaDemo()} />
        </div>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold">I tuoi dati</h2>
        <ModuloAzione azione={aggiornaProfilo} invio="Salva" variantInvio="secondary">
          <Campo etichetta="Nome" name="nome" defaultValue={profilo.nome} maxLength={60} autoComplete="given-name" required />
          <CampoRuoloCucina defaultValue={profilo.ruolo_cucina} />
        </ModuloAzione>
      </section>

      {admin && (
        <section className="mb-8 space-y-3">
          <h2 className="text-xl font-bold">Gestione del locale</h2>
          <Link href="/profilo/team" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-between")}>
            <span className="flex items-center gap-2">
              <Users aria-hidden />
              Squadra e inviti
            </span>
            <ChevronRight aria-hidden />
          </Link>
          <Link href="/profilo/soglie" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-between")}>
            <span className="flex items-center gap-2">
              <Timer aria-hidden />
              Soglie di scadenza
            </span>
            <ChevronRight aria-hidden />
          </Link>
        </section>
      )}

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold">Aspetto</h2>
        <SelettoreTema />
      </section>

      <form action={esci}>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <LogOut aria-hidden />
          Esci
        </Button>
      </form>
      <p className="mt-8 text-center text-muted-foreground">{APP_NAME}</p>
    </>
  );
}
