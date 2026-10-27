import Link from "next/link";
import { cn } from "@/lib/utils";
import { PRESENTAZIONE_STATO, type StatoScadenza } from "@/lib/costanti/stati-scadenza";

export type StatoDaMostrare = Exclude<StatoScadenza, "ok">;
export type Conteggi = Record<StatoDaMostrare, number>;

const ORDINE: StatoDaMostrare[] = ["scaduto", "oggi", "attenzione", "in-scadenza"];

/** Dove porta il tocco su un riquadro (catalogo già filtrato). */
const DESTINAZIONE: Record<StatoDaMostrare, string> = {
  scaduto: "/magazzino?stato=scaduti",
  oggi: "/magazzino?stato=presto",
  attenzione: "/magazzino?stato=presto",
  "in-scadenza": "/magazzino?stato=presto",
};

/**
 * Quanti prodotti ci sono in ogni stato che richiede attenzione.
 * Un riquadro si colora solo se c'è qualcosa da fare: a zero resta neutro, così il colore
 * del semaforo compare solo quando serve e non "grida" quando va tutto bene.
 * Con `collegamenti` ogni riquadro porta al catalogo filtrato.
 */
export function RiepilogoSemaforo({ conteggi, collegamenti = false }: { conteggi: Conteggi; collegamenti?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {ORDINE.map((stato) => {
        const { etichetta, icona: Icona, classi } = PRESENTAZIONE_STATO[stato];
        const n = conteggi[stato];
        const contenuto = (
          <>
            <Icona className="size-6" aria-hidden />
            <span className="font-display text-4xl font-extrabold leading-none">{n}</span>
            <span className="text-base font-semibold">{etichetta}</span>
          </>
        );
        const stile = cn(
          "animazione-entra flex h-full flex-col gap-1 rounded-2xl border-2 p-4 shadow-carta",
          n > 0 ? classi : "border-border bg-card text-muted-foreground",
        );
        return (
          <li key={stato}>
            {collegamenti && n > 0 ? (
              <Link href={DESTINAZIONE[stato]} className={cn(stile, "active:scale-[0.98]")} aria-label={`${n} ${etichetta}: vedi i prodotti`}>
                {contenuto}
              </Link>
            ) : (
              <div className={stile}>{contenuto}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
