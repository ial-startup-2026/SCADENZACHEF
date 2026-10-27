"use client";

import { useState } from "react";
import { Catalogo, type AzioniCatalogo } from "@/components/catalogo/catalogo";
import { arrotonda } from "@/lib/quantita";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";
import { prodottiDemo } from "./dati-demo";

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Il catalogo con azioni simulate nel browser: niente database, solo per vedere come si comporta. */
export function CatalogoDemo({ adessoIso }: { adessoIso: string }) {
  // "Server" finto: i dati che le azioni modificano. Il catalogo parte da una copia separata.
  const [finto] = useState(() => ({
    prodotti: prodottiDemo(adessoIso),
    movimenti: new Map<string, { prodottoId: string; quantita: number }>(),
  }));
  const [iniziali] = useState(() => prodottiDemo(adessoIso));

  const trova = (id: string) => finto.prodotti.find((p) => p.id === id);

  const azioni: AzioniCatalogo = {
    async scarica({ prodottoId, tipo, quantita }) {
      await attesa(400);
      const p = trova(prodottoId);
      if (!p) return { ok: false, errore: "Prodotto non trovato." };
      const q = quantita ?? p.quantita;
      p.quantita = arrotonda(p.quantita - q);
      p.stato = p.quantita > 0 ? "attivo" : tipo === "spreco" ? "buttato" : "finito";
      const movimentoId = crypto.randomUUID();
      finto.movimenti.set(movimentoId, { prodottoId, quantita: q });
      return { ok: true, movimentoId, quantita: p.quantita, stato: p.stato };
    },
    async annulla(movimentoId) {
      await attesa(300);
      const m = finto.movimenti.get(movimentoId);
      const p = m && trova(m.prodottoId);
      if (!m || !p) return { ok: false, errore: "Movimento non trovato." };
      p.quantita = arrotonda(p.quantita + m.quantita);
      p.stato = "attivo";
      return { ok: true, quantita: p.quantita, stato: p.stato };
    },
    async modifica(prodottoId, dati) {
      await attesa(300);
      const p = trova(prodottoId);
      if (!p) return { ok: false, errore: "Prodotto non trovato." };
      Object.assign(p, dati);
      return { ok: true, prodotto: { ...p } };
    },
  };

  return <Catalogo prodotti={iniziali} soglie={SOGLIE_DEFAULT} adessoIso={adessoIso} azioni={azioni} />;
}
