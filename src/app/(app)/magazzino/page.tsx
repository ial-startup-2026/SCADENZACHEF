import type { Metadata } from "next";
import { ErroreCaricamento } from "@/components/errore-caricamento";
import { Catalogo } from "@/components/catalogo/catalogo";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { caricaMagazzino } from "@/lib/dati";
import type { FiltroStato } from "@/lib/scadenze/catalogo";
import { annullaMovimento, modificaProdotto, scaricaProdotto } from "./azioni";

export const metadata: Metadata = { title: "Magazzino" };

const STATI_VALIDI: FiltroStato[] = ["tutti", "presto", "scaduti"];

export default async function MagazzinoPage(props: PageProps<"/magazzino">) {
  const { stato } = await props.searchParams;
  const statoIniziale = STATI_VALIDI.find((s) => s === stato) ?? "tutti";
  const magazzino = await caricaMagazzino();

  return (
    <>
      <IntestazionePagina titolo="Magazzino" />
      {magazzino.errore ? (
        <ErroreCaricamento cosa="il magazzino" href="/magazzino" />
      ) : (
        <Catalogo
          prodotti={magazzino.prodotti}
          soglie={magazzino.soglie}
          adessoIso={new Date().toISOString()}
          filtriIniziali={{ stato: statoIniziale }}
          azioni={{ scarica: scaricaProdotto, annulla: annullaMovimento, modifica: modificaProdotto }}
        />
      )}
    </>
  );
}
