import Link from "next/link";
import { ScanLine } from "lucide-react";
import { AnelloStato, type ConteggiStato } from "@/components/anello-stato";
import { ErroreCaricamento } from "@/components/errore-caricamento";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { buttonVariants } from "@/components/ui/button";
import { dataEstesa, salutoPer } from "@/lib/saluto";
import { cn } from "@/lib/utils";

type Props = {
  adesso: Date;
  nome?: string;
  /** `null` = non sono riuscito a leggere il magazzino. */
  conteggi: ConteggiStato | null;
  /** `false` nelle anteprime senza login. */
  collegamenti?: boolean;
};

/** Contenuto della Home: separato dalla pagina per poterlo mostrare anche con dati di prova. */
export function HomeContenuto({ adesso, nome, conteggi, collegamenti = true }: Props) {
  const daUsare = conteggi?.oggi ?? 0;
  const vai = daUsare > 0 && collegamenti;
  return (
    <>
      <IntestazionePagina
        sopratitolo={dataEstesa(adesso)}
        titolo={nome ? `${salutoPer(adesso)}, ${nome}` : salutoPer(adesso)}
      />

      {conteggi === null ? (
        <ErroreCaricamento cosa="il magazzino" href="/" />
      ) : (
        <div className="space-y-4">
          <section
            aria-labelledby="da-usare-oggi"
            className="sfondo-hero animazione-entra relative overflow-hidden rounded-carta p-6 text-hero-fg shadow-carta"
          >
            {/* Archi decorativi, come il quadrante del riferimento: solo ornamento */}
            <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-10 -top-10 size-52 opacity-25">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray="55 100" style={{ transform: "rotate(150deg)", transformOrigin: "50% 50%" }} />
              <circle cx="100" cy="100" r="52" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray="40 100" style={{ transform: "rotate(20deg)", transformOrigin: "50% 50%" }} />
            </svg>
            <div className="relative space-y-2">
              <h2 id="da-usare-oggi" className="text-lg font-medium">
                Da usare oggi
              </h2>
              <p className="text-7xl font-light leading-none tracking-tight">{daUsare}</p>
              <p className="text-lg">
                {daUsare === 0
                  ? "Niente scade oggi: tutto sotto controllo."
                  : daUsare === 1
                    ? "prodotto scade oggi: usalo per primo."
                    : "prodotti scadono oggi: usali per primi."}
              </p>
            </div>
            <Link
              href={vai ? "/magazzino?stato=presto" : "/scansiona"}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "relative mt-5 w-full bg-hero-cta text-hero-cta-foreground hover:bg-hero-cta/90")}
            >
              {vai ? (
                "Vedi i prodotti"
              ) : (
                <>
                  <ScanLine aria-hidden />
                  Scansiona un prodotto
                </>
              )}
            </Link>
          </section>

          <AnelloStato conteggi={conteggi} collegamenti={collegamenti} />
        </div>
      )}
    </>
  );
}
