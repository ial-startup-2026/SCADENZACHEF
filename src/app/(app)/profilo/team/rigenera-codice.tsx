"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rigeneraCodice } from "../azioni";

/** Rigenerare il codice blocca chi ha ancora quello vecchio: si chiede conferma prima. */
export function RigeneraCodice() {
  const [inCorso, avvia] = useTransition();
  const [conferma, setConferma] = useState(false);

  function esegui() {
    avvia(async () => {
      const esito = await rigeneraCodice();
      if (esito?.errore) toast.error(esito.errore);
      else if (esito?.ok) toast.success(esito.ok);
      setConferma(false);
    });
  }

  if (!conferma) {
    return (
      <Button type="button" variant="ghost" className="w-full" onClick={() => setConferma(true)}>
        <RefreshCw aria-hidden />
        Genera un nuovo codice
      </Button>
    );
  }
  return (
    <div className="space-y-2 rounded-2xl border-2 border-destructive p-3">
      <p className="font-semibold">Il codice attuale smetterà di funzionare. Chi lo ha ancora non potrà più entrare.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={inCorso} onClick={() => setConferma(false)}>
          Annulla
        </Button>
        <Button type="button" variant="destructive" disabled={inCorso} aria-busy={inCorso} onClick={esegui}>
          Sì, genera
        </Button>
      </div>
    </div>
  );
}
