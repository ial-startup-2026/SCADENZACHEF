import type { Metadata } from "next";
import { APP_NAME } from "@/config/app";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { SelettoreTema } from "@/components/selettore-tema";

export const metadata: Metadata = { title: "Profilo" };

export default function ProfiloPage() {
  return (
    <>
      <IntestazionePagina titolo="Profilo" />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Aspetto</h2>
        <SelettoreTema />
      </section>
      <p className="mt-10 text-center text-muted-foreground">{APP_NAME}</p>
    </>
  );
}
