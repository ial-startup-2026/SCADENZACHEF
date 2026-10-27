import Link from "next/link";
import { PackageCheck, ScanLine } from "lucide-react";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { RiepilogoSemaforo, type Conteggi } from "@/components/riepilogo-semaforo";
import { buttonVariants } from "@/components/ui/button";
import { profiloCorrente } from "@/lib/auth";
import { dataEstesa, salutoPer } from "@/lib/saluto";
import { cn } from "@/lib/utils";

// Fase 3: i conteggi arriveranno dal catalogo (stato di scadenza di ogni prodotto attivo).
const CONTEGGI_VUOTI: Conteggi = { scaduto: 0, oggi: 0, attenzione: 0, "in-scadenza": 0 };

export default async function HomePage() {
  const adesso = new Date();
  const dati = await profiloCorrente();
  const nome = dati?.profilo.nome.split(" ")[0];
  const daUsare = CONTEGGI_VUOTI.oggi + CONTEGGI_VUOTI.attenzione;

  return (
    <>
      <IntestazionePagina
        sopratitolo={dataEstesa(adesso)}
        titolo={nome ? `${salutoPer(adesso)}, ${nome}` : salutoPer(adesso)}
      />

      <section
        aria-labelledby="da-usare-oggi"
        className="sfondo-hero animazione-entra relative mb-6 overflow-hidden rounded-3xl p-6 text-hero-fg shadow-carta"
      >
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-14 right-10 size-28 rounded-full bg-white/[0.07]" />
        <div className="relative space-y-1">
          <h2 id="da-usare-oggi" className="flex items-center gap-2 text-lg font-bold">
            <PackageCheck className="size-6" aria-hidden />
            Da usare oggi
          </h2>
          <p className="font-display text-6xl font-extrabold leading-none">{daUsare}</p>
          <p className="text-lg">
            {daUsare === 0 ? "Niente da usare oggi: tutto sotto controllo." : "prodotti da usare per primi."}
          </p>
        </div>
        <Link
          href="/scansiona"
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "relative mt-5 w-full bg-hero-cta text-hero-cta-foreground hover:bg-hero-cta/90")}
        >
          <ScanLine aria-hidden />
          Scansiona un prodotto
        </Link>
      </section>

      <h2 className="mb-3 text-xl font-bold">Stato del magazzino</h2>
      <RiepilogoSemaforo conteggi={CONTEGGI_VUOTI} />
    </>
  );
}
