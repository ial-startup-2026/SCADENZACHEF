import Link from "next/link";
import { PackageCheck, ScanLine } from "lucide-react";
import { ErroreCaricamento } from "@/components/errore-caricamento";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { RiepilogoSemaforo, type Conteggi } from "@/components/riepilogo-semaforo";
import { buttonVariants } from "@/components/ui/button";
import { dataEstesa, salutoPer } from "@/lib/saluto";
import { cn } from "@/lib/utils";

type Props = {
  adesso: Date;
  nome?: string;
  /** `null` = non sono riuscito a leggere il magazzino. */
  conteggi: Conteggi | null;
  /** `false` nelle anteprime senza login. */
  collegamenti?: boolean;
};

/** Contenuto della Home: separato dalla pagina per poterlo mostrare anche con dati di prova. */
export function HomeContenuto({ adesso, nome, conteggi, collegamenti = true }: Props) {
  const daUsare = conteggi?.oggi ?? 0;
  return (
    <>
      <IntestazionePagina
        sopratitolo={dataEstesa(adesso)}
        titolo={nome ? `${salutoPer(adesso)}, ${nome}` : salutoPer(adesso)}
      />

      {conteggi === null ? (
        <ErroreCaricamento cosa="il magazzino" href="/" />
      ) : (
        <>
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
                {daUsare === 0
                  ? "Niente scade oggi: tutto sotto controllo."
                  : daUsare === 1
                    ? "prodotto scade oggi: usalo per primo."
                    : "prodotti scadono oggi: usali per primi."}
              </p>
            </div>
            <Link
              href={daUsare > 0 && collegamenti ? "/magazzino?stato=presto" : "/scansiona"}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "relative mt-5 w-full bg-hero-cta text-hero-cta-foreground hover:bg-hero-cta/90")}
            >
              {daUsare > 0 && collegamenti ? (
                "Vedi i prodotti"
              ) : (
                <>
                  <ScanLine aria-hidden />
                  Scansiona un prodotto
                </>
              )}
            </Link>
          </section>

          <h2 className="mb-3 text-xl font-bold">Stato del magazzino</h2>
          <RiepilogoSemaforo conteggi={conteggi} collegamenti={collegamenti} />
        </>
      )}
    </>
  );
}
