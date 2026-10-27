import { SCAN } from "@/config/app";
import { registraProdotto } from "@/app/scansiona/azioni";
import { ridimensionaImmagine } from "@/lib/immagini";
import { esitoDaRisposta, segnaleConTempoMassimo } from "@/lib/scan/risposta";
import type { ServiziScansione } from "@/lib/scan/tipi";
import { creaClientBrowser } from "@/lib/supabase/client";

/**
 * Servizi della vera app: la foto va al server (/api/scan) che la fa leggere, la foto dell'etichetta
 * si archivia in Storage e il prodotto si registra con una Server Action.
 * In modalità demo non c'è archivio: la foto non si salva.
 */
export function creaServiziApp(localeId: string, demo: boolean): ServiziScansione {
  return {
    comprimi: (file) => ridimensionaImmagine(file, { latoMax: SCAN.latoMaxPx, qualita: SCAN.qualitaJpeg }),

    async leggi(foto, segnale) {
      try {
        const corpo = new FormData();
        corpo.append("immagine", foto, "etichetta.jpg");
        const risposta = await fetch("/api/scan", {
          method: "POST",
          body: corpo,
          signal: segnaleConTempoMassimo(segnale, SCAN.timeoutMs),
        });
        return esitoDaRisposta(await risposta.json().catch(() => null));
      } catch {
        return { ok: false, motivo: "errore" };
      }
    },

    async salva(dati, foto) {
      let fotoPath: string | null = null;
      let avviso: string | undefined;

      if (foto && !demo) {
        const percorso = `${localeId}/${dati.clientUuid}.jpg`;
        const { error } = await creaClientBrowser()
          .storage.from("etichette")
          .upload(percorso, foto, { contentType: "image/jpeg" });
        // Se un invio precedente aveva già caricato la foto, il file c'è: va bene lo stesso.
        if (!error || /already exists|duplicate/i.test(error.message)) fotoPath = percorso;
        else avviso = "Il prodotto è salvato, ma non sono riuscito a salvare la foto dell'etichetta.";
      }

      const esito = await registraProdotto({ ...dati, fotoPath });
      return esito.ok ? { ok: true, prodottoId: esito.prodottoId, avviso } : { ok: false, errore: esito.errore };
    },
  };
}
