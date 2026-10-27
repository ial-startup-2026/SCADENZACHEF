"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Check, MapPin, Trash2 } from "lucide-react";
import { ChipStato } from "@/components/chip-stato";
import { ALLERGENI } from "@/lib/costanti/allergeni";
import { POSIZIONI } from "@/lib/costanti/posizioni";
import { PRESENTAZIONE_STATO } from "@/lib/costanti/stati-scadenza";
import { formattaQuantita } from "@/lib/quantita";
import type { Soglie } from "@/lib/scadenze/soglie";
import { dataBreve, dettaglioGiorni, statoScadenza, testoGiorni } from "@/lib/scadenze/stato-scadenza";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import { cn } from "@/lib/utils";

/** Quanto bisogna trascinare (px) perché lo swipe apra l'azione. */
const SOGLIA_SWIPE = 90;

type Props = {
  prodotto: ProdottoMagazzino;
  adesso: Date;
  soglie: Soglie;
  onApri: () => void;
  onUsato: () => void;
  onButta: () => void;
};

const ETICHETTA_ALLERGENE = Object.fromEntries(ALLERGENI.map((a) => [a.codice, a.etichetta]));
const ETICHETTA_POSIZIONE = Object.fromEntries(POSIZIONI.map((p) => [p.codice, p.etichetta]));

/**
 * Scheda di un prodotto: nome, scadenza in evidenza, poi allergeni e posizione.
 * Swipe a destra = "Usato", a sinistra = "Butta" (apre il foglio di conferma, non agisce subito).
 * Toccando la scheda si aprono tutte le azioni: lo swipe è una scorciatoia, mai l'unica strada.
 */
export function CardProdotto({ prodotto, adesso, soglie, onApri, onUsato, onButta }: Props) {
  const x = useMotionValue(0);
  const opacitaUsato = useTransform(x, [0, 50], [0, 1]);
  const opacitaButta = useTransform(x, [-50, 0], [1, 0]);
  const trascinata = useRef(false);

  const { stato, giorni } = statoScadenza(prodotto.data_scadenza, adesso, soglie);
  const { barra } = PRESENTAZIONE_STATO[stato];

  return (
    <li className="relative">
      <motion.div
        aria-hidden
        style={{ opacity: opacitaUsato }}
        className="absolute inset-0 flex items-center gap-2 rounded-carta bg-primary px-6 text-xl font-bold text-primary-foreground"
      >
        <Check className="size-7" /> Usato
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: opacitaButta }}
        className="absolute inset-0 flex items-center justify-end gap-2 rounded-carta bg-destructive px-6 text-xl font-bold text-background"
      >
        Butta <Trash2 className="size-7" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        style={{ x }}
        onDragStart={() => {
          trascinata.current = true;
        }}
        onDragEnd={(_, info) => {
          // Il click che segue il rilascio non deve aprire la scheda.
          setTimeout(() => (trascinata.current = false), 0);
          if (info.offset.x > SOGLIA_SWIPE) onUsato();
          else if (info.offset.x < -SOGLIA_SWIPE) onButta();
        }}
        className="relative rounded-carta bg-card shadow-carta"
      >
        {/* Barretta colorata dello stato: rinforza il chip, che resta il segnale principale. */}
        <span aria-hidden className={cn("absolute bottom-5 left-3.5 top-5 w-1.5 rounded-full", barra)} />
        <button
          type="button"
          onClick={() => !trascinata.current && onApri()}
          className="block min-h-14 w-full rounded-carta py-4 pl-8 pr-4 text-left"
          aria-label={`${prodotto.nome}, ${testoGiorni(giorni)}. Apri le azioni`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-xl font-semibold leading-tight tracking-tight">{prodotto.nome}</h3>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-base font-semibold">
              {formattaQuantita(prodotto.quantita, prodotto.unita)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <ChipStato stato={stato} />
            {dettaglioGiorni(stato, giorni) && <span className="text-lg font-bold">{dettaglioGiorni(stato, giorni)}</span>}
            <span className="text-muted-foreground">{dataBreve(prodotto.data_scadenza, adesso)}</span>
          </div>

          {prodotto.allergeni.length > 0 && (
            <p className="mt-2 text-base">
              <span className="font-bold">Contiene: </span>
              {prodotto.allergeni.map((a) => ETICHETTA_ALLERGENE[a]).join(", ")}
            </p>
          )}

          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-5 shrink-0" aria-hidden />
            {ETICHETTA_POSIZIONE[prodotto.posizione]}
            {prodotto.lotto && ` · Lotto ${prodotto.lotto}`}
          </p>
        </button>
      </motion.div>
    </li>
  );
}
