import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ErroreCaricamento } from "@/components/errore-caricamento";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { buttonVariants } from "@/components/ui/button";
import { richiediAdmin } from "@/lib/auth";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";
import { creaClientServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ModuloSoglie } from "./modulo-soglie";

export const metadata: Metadata = { title: "Soglie di scadenza" };

export default async function SogliePage() {
  await richiediAdmin();
  const supabase = await creaClientServer();
  const { data, error } = await supabase
    .from("impostazioni_locale")
    .select("soglia_giallo, soglia_arancione")
    .maybeSingle<{ soglia_giallo: number; soglia_arancione: number }>();

  return (
    <>
      <Link href="/profilo" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 mb-2")}>
        <ChevronLeft aria-hidden />
        Profilo
      </Link>
      <IntestazionePagina titolo="Soglie di scadenza" sottotitolo="Quando un prodotto cambia colore." />
      {error ? (
        <ErroreCaricamento cosa="le soglie" href="/profilo/soglie" />
      ) : (
        <ModuloSoglie
          iniziali={data ? { giallo: data.soglia_giallo, arancione: data.soglia_arancione } : SOGLIE_DEFAULT}
        />
      )}
    </>
  );
}
