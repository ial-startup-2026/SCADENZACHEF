"use client";

import { useState } from "react";
import { Catalogo, type AzioniCatalogo } from "@/components/catalogo/catalogo";
import { annullaSu, modificaSu, scaricaSu } from "@/lib/demo/operazioni";
import { registroClient } from "@/lib/demo/registro-client";
import type { Filtri } from "@/lib/scadenze/catalogo";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Il catalogo con azioni simulate nel browser: niente database, solo per vedere come si comporta. */
export function CatalogoDemo({ adessoIso, filtriIniziali }: { adessoIso: string; filtriIniziali?: Partial<Filtri> }) {
  // "Server" finto: i dati che le azioni modificano. Il catalogo parte da una copia separata.
  // È il magazzino di prova condiviso con la scansione: un prodotto aggiunto lì compare qui.
  const [finto] = useState(registroClient);
  const [iniziali] = useState(() => finto.prodotti.map((p) => ({ ...p })));

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
