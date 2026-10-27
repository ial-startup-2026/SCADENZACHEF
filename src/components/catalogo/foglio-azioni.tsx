"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { ChipStato } from "@/components/chip-stato";
import { Foglio } from "@/components/foglio";
import { Button } from "@/components/ui/button";
import { formattaQuantita } from "@/lib/quantita";
import type { Soglie } from "@/lib/scadenze/soglie";
import { dataBreve, dettaglioGiorni, statoScadenza } from "@/lib/scadenze/stato-scadenza";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";

type Props = {
  prodotto: ProdottoMagazzino | null;
  adesso: Date;
  soglie: Soglie;
  onChiudi: () => void;
  onUsato: (p: ProdottoMagazzino) => void;
  onButta: (p: ProdottoMagazzino) => void;
  onModifica: (p: ProdottoMagazzino) => void;
};

/** Tocco sulla scheda: le tre azioni, grandi e in basso. */
export function FoglioAzioni({ prodotto, adesso, soglie, onChiudi, onUsato, onButta, onModifica }: Props) {
  const info = prodotto && statoScadenza(prodotto.data_scadenza, adesso, soglie);
  return (
    <Foglio
      aperto={prodotto !== null}
      onChiudi={onChiudi}
      titolo={prodotto?.nome ?? ""}
      descrizione={prodotto ? `${formattaQuantita(prodotto.quantita, prodotto.unita)} in magazzino` : undefined}
    >
      {prodotto && info && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ChipStato stato={info.stato} />
            {dettaglioGiorni(info.stato, info.giorni) && <span className="text-lg font-bold">{dettaglioGiorni(info.stato, info.giorni)}</span>}
            <span className="text-muted-foreground">{dataBreve(prodotto.data_scadenza, adesso)}</span>
          </div>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => onUsato(prodotto)}>
              <Check aria-hidden />
              Usato / Finito
            </Button>
            <Button size="lg" variant="outline" className="w-full border-destructive text-destructive" onClick={() => onButta(prodotto)}>
              <Trash2 aria-hidden />
              Buttato
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => onModifica(prodotto)}>
              <Pencil aria-hidden />
              Modifica
            </Button>
          </div>
        </div>
      )}
    </Foglio>
  );
}
