import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PRESENTAZIONE_STATO, type StatoScadenza } from "@/lib/costanti/stati-scadenza";
import { ARCO, ORDINE_ANELLO, SPORGENZA, segmentiAnello } from "@/lib/anello";
import { cn } from "@/lib/utils";

export type ConteggiStato = Record<StatoScadenza, number>;

/** Dove porta il tocco su una riga della legenda (catalogo già filtrato). */
const DESTINAZIONE: Record<StatoScadenza, string> = {
  scaduto: "/magazzino?stato=scaduti",
  oggi: "/magazzino?stato=presto",
  attenzione: "/magazzino?stato=presto",
  "in-scadenza": "/magazzino?stato=presto",
  ok: "/magazzino",
};

const R = 80;
const TRATTO = 18;

/**
 * Anello del magazzino: quanti prodotti ci sono in ogni stato. Il totale è al centro; la legenda
 * sotto dice a parole e con numeri la stessa cosa (l'anello da solo non basta: stato = icona + testo).
 * Con `collegamenti` ogni riga porta al catalogo filtrato.
 */
export function AnelloStato({ conteggi, collegamenti = false }: { conteggi: ConteggiStato; collegamenti?: boolean }) {
  const totale = ORDINE_ANELLO.reduce((somma, s) => somma + conteggi[s], 0);
  const segmenti = segmentiAnello(conteggi);
  const stileCerchio = { transform: "rotate(135deg)", transformOrigin: "50% 50%" } as const;

  return (
    <section aria-labelledby="titolo-anello" className="animazione-entra rounded-carta bg-card p-5 shadow-carta">
      <h2 id="titolo-anello" className="text-xl font-medium tracking-tight">
        Stato del magazzino
      </h2>

      <div className="relative mx-auto my-3 size-60">
        <svg viewBox="0 0 200 200" aria-hidden className="size-full">
          {/* Pista grigia dietro ai segmenti */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={TRATTO}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${ARCO - 2 * SPORGENZA} 100`}
            strokeDashoffset={-SPORGENZA}
            style={stileCerchio}
          />
          {segmenti.map((s) => (
            <circle
              key={s.stato}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={`var(--anello-${s.stato})`}
              strokeWidth={TRATTO}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${s.lunghezza} 100`}
              strokeDashoffset={-s.inizio}
              style={stileCerchio}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-3">
          <span className="text-6xl font-light leading-none tracking-tight">{totale}</span>
          <span className="mt-1 text-muted-foreground">{totale === 1 ? "prodotto" : "prodotti"}</span>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {ORDINE_ANELLO.map((stato) => {
          const { etichetta, icona: Icona, classi } = PRESENTAZIONE_STATO[stato];
          const n = conteggi[stato];
          const riga = (
            <>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
                  n > 0 ? classi : "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Icona className="size-5" aria-hidden />
              </span>
              <span className={cn("flex-1 text-lg", n === 0 && "text-muted-foreground")}>{etichetta}</span>
              <span className={cn("text-2xl font-light", n === 0 && "text-muted-foreground")}>{n}</span>
              {collegamenti && n > 0 && <ChevronRight className="size-5 text-muted-foreground" aria-hidden />}
            </>
          );
          return (
            <li key={stato}>
              {collegamenti && n > 0 ? (
                <Link
                  href={DESTINAZIONE[stato]}
                  className="flex min-h-14 items-center gap-3 py-2 active:bg-secondary"
                  aria-label={`${n} ${etichetta}: vedi i prodotti`}
                >
                  {riga}
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 py-2">{riga}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
