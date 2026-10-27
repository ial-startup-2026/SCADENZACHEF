import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { StatoVuoto } from "@/components/stato-vuoto";

export const metadata: Metadata = { title: "Spesa" };

export default function SpesaPage() {
  return (
    <>
      <IntestazionePagina titolo="Spesa" sottotitolo="Quello che manca in cucina." />
      <StatoVuoto
        icona={ShoppingCart}
        titolo="Non manca niente"
        descrizione="Quando finisce qualcosa, aggiungilo qui e la squadra lo vede subito."
      />
    </>
  );
}
