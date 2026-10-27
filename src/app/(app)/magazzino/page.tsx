import type { Metadata } from "next";
import { Boxes, ScanLine } from "lucide-react";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { StatoVuoto } from "@/components/stato-vuoto";

export const metadata: Metadata = { title: "Magazzino" };

export default function MagazzinoPage() {
  return (
    <>
      <IntestazionePagina titolo="Magazzino" sottotitolo="Prima esce ciò che scade prima." />
      <StatoVuoto
        icona={Boxes}
        titolo="Il magazzino è vuoto"
        descrizione="Scansiona l'etichetta di un prodotto per aggiungerlo: ci vogliono pochi secondi."
        azione={{ href: "/scansiona", etichetta: "Scansiona", icona: ScanLine }}
      />
    </>
  );
}
