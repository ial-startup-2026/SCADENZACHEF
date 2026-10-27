import { notFound } from "next/navigation";
import { TabBar } from "@/components/tab-bar";
import HomePage from "../../(app)/page";
import MagazzinoPage from "../../(app)/magazzino/page";
import SpesaPage from "../../(app)/spesa/page";
import ScansionaPage from "../../scansiona/page";

const SCHERMATE = {
  home: { Pagina: HomePage, percorso: "/" },
  magazzino: { Pagina: MagazzinoPage, percorso: "/magazzino" },
  spesa: { Pagina: SpesaPage, percorso: "/spesa" },
  scansiona: { Pagina: ScansionaPage, percorso: null },
} as const;

/** Anteprima delle schermate senza login, per controllare la grafica. Solo in sviluppo. */
export default async function AnteprimaPage(props: PageProps<"/design/[schermata]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { schermata } = await props.params;
  if (!(schermata in SCHERMATE)) notFound();
  const { Pagina, percorso } = SCHERMATE[schermata as keyof typeof SCHERMATE];

  if (percorso === null) return <Pagina />;
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Pagina />
      </main>
      <TabBar percorso={percorso} />
    </>
  );
}
