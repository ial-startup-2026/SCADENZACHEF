"use client";

import { useState } from "react";
import { Catalogo, type AzioniCatalogo } from "@/components/catalogo/catalogo";
import { annullaSu, modificaSu, scaricaSu, type Registro } from "@/lib/demo/operazioni";
import { prodottiDemo } from "@/lib/demo/prodotti";
import type { Filtri } from "@/lib/scadenze/catalogo";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Il catalogo con azioni simulate nel browser: niente database, solo per vedere come si comporta. */
export function CatalogoDemo({ adessoIso, filtriIniziali }: { adessoIso: string; filtriIniziali?: Partial<Filtri> }) {
  // "Server" finto: i dati che le azioni modificano. Il catalogo parte da una copia separata.
  const [finto] = useState<Registro>(() => ({ prodotti: prodottiDemo(adessoIso), movimenti: new Map() }));
  const [iniziali] = useState(() => prodottiDemo(adessoIso));

  const azioni: AzioniCatalogo = {
    async scarica(input) {
      await attesa(400);
      return scaricaSu(finto, input as Parameters<typeof scaricaSu>[1]);
    },
    async annulla(movimentoId) {
      await attesa(300);
      return annullaSu(finto, movimentoId);
    },
    async modifica(prodottoId, dati) {
      await attesa(300);
      return modificaSu(finto, prodottoId, dati);
    },
  };

  return <Catalogo prodotti={iniziali} soglie={SOGLIE_DEFAULT} adessoIso={adessoIso} azioni={azioni} filtriIniziali={filtriIniziali} />;
}
