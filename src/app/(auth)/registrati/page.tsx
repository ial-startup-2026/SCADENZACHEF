import type { Metadata } from "next";
import Link from "next/link";
import { Campo } from "@/components/campo";
import { ModuloAzione } from "@/components/modulo-azione";
import { percorsoSicuro } from "@/lib/percorsi";
import { registrati } from "../azioni";

export const metadata: Metadata = { title: "Registrati" };

export default async function RegistratiPage(props: PageProps<"/registrati">) {
  const { next } = await props.searchParams;
  const destinazione = percorsoSicuro(typeof next === "string" ? next : null);
  const link = destinazione === "/" ? "" : `?next=${encodeURIComponent(destinazione)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Crea il tuo account</h1>
        <p className="text-muted-foreground">Poi crei il tuo locale o entri con il codice che ti ha dato il titolare.</p>
      </div>
      <ModuloAzione azione={registrati} invio="Registrati">
        <input type="hidden" name="next" value={destinazione} />
        <Campo etichetta="Email" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Campo
          etichetta="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          suggerimento="Almeno 8 caratteri."
          required
        />
      </ModuloAzione>
      <p className="text-center">
        Hai già un account?{" "}
        <Link href={`/accedi${link}`} className="font-bold text-primary underline underline-offset-4">
          Accedi
        </Link>
      </p>
    </div>
  );
}
