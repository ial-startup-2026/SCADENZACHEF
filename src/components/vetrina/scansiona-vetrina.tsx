"use client";

import { Scansione } from "@/components/scansione/scansione";
import { registroClient } from "@/lib/demo/registro-client";
import { registraSu } from "@/lib/demo/operazioni";
import { prossimaLetturaDiProva } from "@/lib/scan/mock";
import type { ServiziScansione } from "@/lib/scan/tipi";

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Servizi della vetrina: nessun server, la "lettura" è finta e il prodotto va nel magazzino di prova del browser. */
const servizi: ServiziScansione = {
  comprimi: async (file) => file,
  async leggi(_foto, segnale) {
    await attesa(1200);
    if (segnale?.aborted) return { ok: false, motivo: "errore" };
    return prossimaLetturaDiProva(new Date());
  },
  async salva(dati) {
    const esito = registraSu(registroClient(), { ...dati, fotoPath: null });
    return esito.ok ? { ok: true, prodottoId: esito.prodottoId } : { ok: false, errore: esito.errore };
  },
};

export function ScansionaVetrina() {
  return <Scansione servizi={servizi} />;
}
