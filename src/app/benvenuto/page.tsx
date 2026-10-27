import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaginaMarchio } from "@/components/pagina-marchio";
import { profiloCorrente, utenteCorrente } from "@/lib/auth";
import { ModuloBenvenuto } from "./modulo-benvenuto";

export const metadata: Metadata = { title: "Benvenuto" };

export default async function BenvenutoPage(props: PageProps<"/benvenuto">) {
  if (!(await utenteCorrente())) redirect("/accedi");
  if (await profiloCorrente()) redirect("/");

  const { codice } = await props.searchParams;
  const codiceIniziale = typeof codice === "string" ? codice.toUpperCase().slice(0, 12) : "";

  return (
    <PaginaMarchio>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Benvenuto in cucina</h1>
          <p className="text-muted-foreground">Entra nel locale della tua squadra o creane uno nuovo.</p>
        </div>
        <ModuloBenvenuto codiceIniziale={codiceIniziale} />
      </div>
    </PaginaMarchio>
  );
}
