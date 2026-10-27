import { notFound } from "next/navigation";
import { HomeContenuto } from "@/components/home-contenuto";
import { IntestazionePagina } from "@/components/intestazione-pagina";
import { TabBar } from "@/components/tab-bar";
import SpesaPage from "../../(app)/spesa/page";
import ScansionaPage from "../../scansiona/page";
import { CatalogoDemo } from "../catalogo-demo";
import { prodottiDemo } from "../dati-demo";
import { contaPerStato } from "@/lib/scadenze/catalogo";
import { ModuloSoglie } from "../../(app)/profilo/soglie/modulo-soglie";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";

export const SCHERMATE_ANTEPRIMA = ["home", "magazzino", "spesa", "scansiona", "soglie"] as const;

/** Anteprima delle schermate senza login e con dati di prova, per controllare la grafica. Solo in sviluppo. */
export default async function AnteprimaPage(props: PageProps<"/design/[schermata]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { schermata } = await props.params;
  if (!(SCHERMATE_ANTEPRIMA as readonly string[]).includes(schermata)) notFound();

  const adesso = new Date();
  const adessoIso = adesso.toISOString();

  if (schermata === "scansiona") return <ScansionaPage />;

  const conteggi = contaPerStato(prodottiDemo(adessoIso), adesso, SOGLIE_DEFAULT);
  const contenuto = {
    home: (
      <HomeContenuto
        adesso={adesso}
        nome="Marta"
        collegamenti={false}
        conteggi={{ scaduto: conteggi.scaduto, oggi: conteggi.oggi, attenzione: conteggi.attenzione, "in-scadenza": conteggi["in-scadenza"] }}
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
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">{contenuto}</main>
      <TabBar percorso={percorso} />
    </>
  );
}
