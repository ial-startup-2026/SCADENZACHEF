"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChipStato } from "@/components/chip-stato";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { STATI_SCADENZA } from "@/lib/costanti/stati-scadenza";
import { descriviSoglie, schemaSoglie, type Soglie } from "@/lib/scadenze/soglie";
import { salvaSoglie } from "./azioni";

export function ModuloSoglie({ iniziali }: { iniziali: Soglie }) {
  const [giallo, setGiallo] = useState(iniziali.giallo);
  const [arancione, setArancione] = useState(iniziali.arancione);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();

  const validazione = schemaSoglie.safeParse({ giallo, arancione });
  const descrizione = descriviSoglie({ giallo, arancione });
  const giorni = (n: number) => `${n} ${n === 1 ? "giorno" : "giorni"}`;
  const cambiato = giallo !== iniziali.giallo || arancione !== iniziali.arancione;

  function salva() {
    setErrore(null);
    avvia(async () => {
      const esito = await salvaSoglie({ giallo, arancione });
      if (esito.ok) toast.success("Soglie salvate");
      else setErrore(esito.errore);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">&ldquo;In scadenza&rdquo; (giallo) fino a</h2>
        <Stepper etichetta="Giorni per lo stato In scadenza" valore={giallo} onChange={setGiallo} min={2} max={60} passo={1} unita="pz" formatta={giorni} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">&ldquo;Attenzione&rdquo; (arancione) fino a</h2>
        <Stepper etichetta="Giorni per lo stato Attenzione" valore={arancione} onChange={setArancione} min={1} max={59} passo={1} unita="pz" formatta={giorni} />
      </section>

      <section aria-label="Anteprima" className="space-y-3 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-lg font-bold">Così funzionerà</h2>
        <ul className="space-y-2">
          {[...STATI_SCADENZA].reverse().map((s) => (
            <li key={s} className="flex items-center justify-between gap-3">
              <ChipStato stato={s} />
              <span className="text-right text-lg">{descrizione[s]}</span>
            </li>
          ))}
        </ul>
      </section>

      {(errore || !validazione.success) && (
        <p role="alert" className="rounded-xl border-2 border-destructive px-4 py-3 font-semibold text-destructive">
          {errore ?? (!validazione.success ? validazione.error.issues[0].message : "")}
        </p>
      )}
      <Button size="lg" className="w-full" disabled={!validazione.success || !cambiato || inCorso} aria-busy={inCorso} onClick={salva}>
        {inCorso && <Loader2 className="animate-spin" aria-hidden />}
        Salva le soglie
      </Button>
    </div>
  );
}
