import { notFound } from "next/navigation";
import { HomeContenuto } from "@/components/home-contenuto";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { BarraSuperiore } from "@/components/barra-superiore";
import { TabBar } from "@/components/tab-bar";
import AccediPage from "../../(auth)/accedi/page";
import { PaginaMarchio } from "@/components/pagina-marchio";
import SpesaPage from "../../(app)/spesa/page";
import { ScansionaVetrina } from "@/components/vetrina/scansiona-vetrina";
import { CatalogoDemo } from "../catalogo-demo";
import { prodottiDemo } from "@/lib/demo/prodotti";
import { contaPerStato } from "@/lib/scadenze/catalogo";
import { ModuloSoglie } from "../../(app)/profilo/soglie/modulo-soglie";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";

export const SCHERMATE_ANTEPRIMA = ["home", "magazzino", "spesa", "scansiona", "soglie", "accedi"] as const;

/** Anteprima delle schermate senza login e con dati di prova, per controllare la grafica. Solo in sviluppo. */
export default async function AnteprimaPage(props: PageProps<"/design/[schermata]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { schermata } = await props.params;
  if (!(SCHERMATE_ANTEPRIMA as readonly string[]).includes(schermata)) notFound();

  const adesso = new Date();
  const adessoIso = adesso.toISOString();

  if (schermata === "scansiona") return <ScansionaVetrina />;
  if (schermata === "accedi") {
    const props = { params: Promise.resolve({}), searchParams: Promise.resolve({}) } as unknown as Parameters<typeof AccediPage>[0];
    return <PaginaMarchio>{await AccediPage(props)}</PaginaMarchio>;
  }

  const conteggi = contaPerStato(prodottiDemo(adessoIso), adesso, SOGLIE_DEFAULT);
  const contenuto = {
    home: (
      <HomeContenuto
        adesso={adesso}
        nome="Marta"
        collegamenti={false}
        conteggi={conteggi}
      />
    ),
    magazzino: (
      <>
        <IntestazionePagina titolo="Magazzino" />
        <CatalogoDemo adessoIso={adessoIso} />
      </>
    ),
    spesa: <SpesaPage />,
    soglie: (
      <>
        <IntestazionePagina titolo="Soglie di scadenza" sottotitolo="Quando un prodotto cambia colore." />
        <ModuloSoglie iniziali={SOGLIE_DEFAULT} />
      </>
    ),
  }[schermata as "home" | "magazzino" | "spesa" | "soglie"];

  const percorso = { home: "/", magazzino: "/magazzino", spesa: "/spesa", soglie: "/profilo" }[schermata as "home" | "magazzino" | "spesa" | "soglie"];
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <BarraSuperiore nome="Marta Rossi" />
        {contenuto}
      </main>
      <TabBar percorso={percorso} />
    </>
  );
}
