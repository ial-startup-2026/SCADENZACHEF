import { PackageCheck, ScanLine } from "lucide-react";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { StatoVuoto } from "@/components/stato-vuoto";

export default function HomePage() {
  return (
    <>
      <IntestazionePagina titolo="Oggi" sottotitolo="Cosa c'è da usare e cosa manca." />
      <h2 className="mb-3 text-xl font-bold">Da usare oggi</h2>
      <StatoVuoto
        icona={PackageCheck}
        titolo="Niente da usare oggi"
        descrizione="Quando qualcosa sta per scadere lo trovi qui, in cima. Intanto aggiungi i prodotti che hai in magazzino."
        azione={{ href: "/scansiona", etichetta: "Scansiona un prodotto", icona: ScanLine }}
      />
    </>
  );
}
