"use client";

import { HomeContenuto } from "@/components/home-contenuto";
import { prodottiDemo } from "@/lib/demo/prodotti";
import { contaPerStato } from "@/lib/scadenze/catalogo";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";
import { useAdessoNelBrowser } from "./adesso";

export function HomeVetrina() {
  const adesso = useAdessoNelBrowser();
  if (!adesso) return <div aria-hidden className="h-96" />;
  const conteggi = contaPerStato(prodottiDemo(adesso.toISOString()), adesso, SOGLIE_DEFAULT);
  return <HomeContenuto adesso={adesso} nome="Marta" conteggi={conteggi} />;
}
