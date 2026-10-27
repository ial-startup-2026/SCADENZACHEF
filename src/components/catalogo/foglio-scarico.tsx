"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Foglio } from "@/components/foglio";
import { GruppoChip } from "@/components/gruppo-chip";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { MOTIVI_SPRECO, type CodiceMotivoSpreco } from "@/lib/costanti/motivi-spreco";
import { arrotonda, formattaQuantita, PASSO_PER_UNITA, scorciatoie } from "@/lib/quantita";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import { cn } from "@/lib/utils";

export type ScaricoConfermato = {
  tipo: "scarico" | "spreco";
  /** `null` = tutto il rimasto. */
  quantita: number | null;
  motivo: CodiceMotivoSpreco | null;
};

type Props = {
  prodotto: ProdottoMagazzino | null;
  tipo: "scarico" | "spreco";
  onChiudi: () => void;
  onConferma: (p: ProdottoMagazzino, esito: ScaricoConfermato) => void;
};

/** Foglio di conferma: quanto ne usi / ne butti (e perché). Nessuna azione parte senza questo passaggio. */
export function FoglioScarico({ prodotto, tipo, onChiudi, onConferma }: Props) {
  return (
    <Foglio
      aperto={prodotto !== null}
      onChiudi={onChiudi}
      titolo={tipo === "spreco" ? "Quanto ne butti?" : "Quanto ne hai usato?"}
      descrizione={prodotto?.nome}
    >
      {/* Il contenuto si rimonta a ogni prodotto: lo stato interno riparte da zero. */}
      {prodotto && <Contenuto key={`${prodotto.id}-${tipo}`} prodotto={prodotto} tipo={tipo} onConferma={onConferma} />}
    </Foglio>
  );
}

function Contenuto({
  prodotto,
  tipo,
  onConferma,
}: {
  prodotto: ProdottoMagazzino;
  tipo: "scarico" | "spreco";
  onConferma: Props["onConferma"];
}) {
  const max = prodotto.quantita;
  // Di solito si usa/butta tutto: parte da "tutto" e si scende con lo stepper.
  const [quantita, setQuantita] = useState(max);
  const [motivo, setMotivo] = useState<CodiceMotivoSpreco | null>(null);
  const spreco = tipo === "spreco";
  const tutto = quantita >= max;
  const rimasta = arrotonda(max - quantita);
  const pronto = quantita > 0 && (!spreco || motivo !== null);

  const etichetta = spreco
    ? tutto
      ? "Butta tutto"
      : `Butta ${formattaQuantita(quantita, prodotto.unita)}`
    : tutto
      ? "Finito: usa tutto"
      : `Usato ${formattaQuantita(quantita, prodotto.unita)}`;

  return (
    <div className="space-y-5">
      <Stepper etichetta="Quantità" valore={quantita} onChange={setQuantita} min={Math.min(max, PASSO_PER_UNITA[prodotto.unita])} max={max} unita={prodotto.unita} />

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Scorciatoie">
        {scorciatoie(max, prodotto.unita).map(({ etichetta: nome, valore }) => (
          <button
            key={nome}
            type="button"
            onClick={() => setQuantita(valore)}
            className={cn(
              "min-h-12 min-w-16 rounded-full border-2 px-4 text-lg font-bold active:scale-95",
              quantita === valore ? "border-primary bg-primary-soft text-primary" : "border-input bg-card",
            )}
          >
            {nome}
          </button>
        ))}
      </div>

      <p className="text-center text-lg text-muted-foreground">
        {tutto ? "Non ne rimane più" : `Ne rimangono ${formattaQuantita(rimasta, prodotto.unita)}`}
      </p>

      {spreco && (
        <div className="space-y-2">
          <p className="text-lg font-bold">Perché lo butti?</p>
          <GruppoChip
            etichetta="Motivo"
            voci={MOTIVI_SPRECO.map((m) => ({ valore: m.codice, etichetta: m.etichetta }))}
            selezionati={motivo ? [motivo] : []}
            onToggle={(m) => setMotivo(m)}
          />
        </div>
      )}

      <Button
        size="lg"
        variant={spreco ? "destructive" : "default"}
        className="w-full"
        disabled={!pronto}
        onClick={() => onConferma(prodotto, { tipo, quantita: tutto ? null : quantita, motivo: spreco ? motivo : null })}
      >
        {spreco ? <Trash2 aria-hidden /> : <Check aria-hidden />}
        {etichetta}
      </Button>
      {spreco && !motivo && <p className="text-center text-muted-foreground">Scegli un motivo per continuare.</p>}
    </div>
  );
}
