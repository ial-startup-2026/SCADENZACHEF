import type { Metadata } from "next";
import Link from "next/link";
import { Campo } from "@/components/campo";
import { ModuloAzione } from "@/components/modulo-azione";
import { percorsoSicuro } from "@/lib/percorsi";
import { accedi } from "../azioni";

export const metadata: Metadata = { title: "Accedi" };

export default async function AccediPage(props: PageProps<"/accedi">) {
  const { next, errore } = await props.searchParams;
  const destinazione = percorsoSicuro(typeof next === "string" ? next : null);
  const link = destinazione === "/" ? "" : `?next=${encodeURIComponent(destinazione)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Accedi</h1>
      {errore === "conferma" && (
        <p role="alert" className="rounded-xl border-2 border-destructive px-4 py-3 font-semibold text-destructive">
          Il link non è valido o è scaduto. Accedi, oppure registrati di nuovo.
        </p>
      )}
      <ModuloAzione azione={accedi} invio="Accedi">
        <input type="hidden" name="next" value={destinazione} />
        <Campo etichetta="Email" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Campo etichetta="Password" name="password" type="password" autoComplete="current-password" required />
      </ModuloAzione>
      <p className="text-center">
        Non hai un account?{" "}
        <Link href={`/registrati${link}`} className="font-bold text-primary underline underline-offset-4">
          Registrati
        </Link>
      </p>
    </div>
  );
}
