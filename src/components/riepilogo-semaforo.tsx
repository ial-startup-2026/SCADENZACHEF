import { cn } from "@/lib/utils";
import { PRESENTAZIONE_STATO, type StatoScadenza } from "@/lib/costanti/stati-scadenza";

export type StatoDaMostrare = Exclude<StatoScadenza, "ok">;
export type Conteggi = Record<StatoDaMostrare, number>;

const ORDINE: StatoDaMostrare[] = ["scaduto", "oggi", "attenzione", "in-scadenza"];

/**
 * Quanti prodotti ci sono in ogni stato che richiede attenzione.
 * Un riquadro si colora solo se c'è qualcosa da fare: a zero resta neutro, così il colore
 * del semaforo compare solo quando serve e non "grida" quando va tutto bene.
 */
export function RiepilogoSemaforo({ conteggi }: { conteggi: Conteggi }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {ORDINE.map((stato) => {
        const { etichetta, icona: Icona, classi } = PRESENTAZIONE_STATO[stato];
        const n = conteggi[stato];
        return (
          <li
            key={stato}
            className={cn(
              "animazione-entra flex flex-col gap-1 rounded-2xl border-2 p-4 shadow-carta",
              n > 0 ? classi : "border-border bg-card text-muted-foreground",
            )}
          >
            <Icona className="size-6" aria-hidden />
            <span className="font-display text-4xl font-extrabold leading-none">{n}</span>
            <span className="text-base font-semibold">{etichetta}</span>
          </li>
        );
      })}
    </ul>
  );
}
