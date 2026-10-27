import Link from "next/link";
import { notFound } from "next/navigation";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipStato } from "@/components/chip-stato";
import { RiepilogoSemaforo } from "@/components/riepilogo-semaforo";
import { STATI_SCADENZA } from "@/lib/costanti/stati-scadenza";

/** Pagina di controllo del design system: esiste solo in sviluppo. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Design system</h1>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Schermate</h2>
        <ul className="grid grid-cols-2 gap-2">
          {["home", "magazzino", "spesa", "scansiona", "soglie"].map((s) => (
            <li key={s}>
              <Link href={`/design/${s}`} className="flex min-h-12 items-center justify-center rounded-xl border-2 border-input bg-card font-semibold capitalize">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Semaforo scadenze</h2>
        <div className="flex flex-wrap gap-2">
          {STATI_SCADENZA.map((s) => (
            <ChipStato key={s} stato={s} />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Riepilogo (con dati di prova)</h2>
        <RiepilogoSemaforo conteggi={{ scaduto: 2, oggi: 3, attenzione: 5, "in-scadenza": 0 }} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Bottoni</h2>
        <Button size="lg" className="w-full"><ScanLine />Scansiona</Button>
        <Button variant="outline" className="w-full">Secondario</Button>
        <Button variant="destructive" className="w-full">Butta</Button>
      </section>
    </main>
  );
}
