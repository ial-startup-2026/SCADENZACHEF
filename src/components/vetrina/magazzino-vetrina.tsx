"use client";

import { useSearchParams } from "next/navigation";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { CatalogoDemo } from "@/app/design/catalogo-demo";
import type { FiltroStato } from "@/lib/scadenze/catalogo";
import { useAdessoNelBrowser } from "./adesso";

const STATI: FiltroStato[] = ["tutti", "presto", "scaduti"];

export function MagazzinoVetrina() {
  const adesso = useAdessoNelBrowser();
  const stato = useSearchParams().get("stato");
  const filtro = STATI.find((s) => s === stato) ?? "tutti";
  return (
    <>
      <IntestazionePagina titolo="Magazzino" />
      {adesso ? <CatalogoDemo adessoIso={adesso.toISOString()} filtriIniziali={{ stato: filtro }} /> : <div aria-hidden className="h-96" />}
    </>
  );
}
