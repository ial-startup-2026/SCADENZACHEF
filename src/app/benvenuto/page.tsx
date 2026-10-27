import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/app";
import { profiloCorrente, utenteCorrente } from "@/lib/auth";
import { ModuloBenvenuto } from "./modulo-benvenuto";

export const metadata: Metadata = { title: "Benvenuto" };

export default async function BenvenutoPage(props: PageProps<"/benvenuto">) {
  if (!(await utenteCorrente())) redirect("/accedi");
  if (await profiloCorrente()) redirect("/");

  const { codice } = await props.searchParams;
  const codiceIniziale = typeof codice === "string" ? codice.toUpperCase().slice(0, 12) : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="space-y-1 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-primary">{APP_NAME}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Benvenuto in cucina</h1>
        <p className="text-muted-foreground">Entra nel locale della tua squadra o creane uno nuovo.</p>
      </div>
      <ModuloBenvenuto codiceIniziale={codiceIniziale} />
    </main>
  );
}
