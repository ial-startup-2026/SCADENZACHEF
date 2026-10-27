"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import type { Ruolo } from "@/lib/costanti/ruoli";
import { cambiaRuolo, rimuoviMembro } from "../azioni";

type Props = {
  id: string;
  nome: string;
  ruoloCucina: string | null;
  ruolo: Ruolo;
  urlFoto: string | null;
  sonoIo: boolean;
};

export function RigaMembro({ id, nome, ruoloCucina, ruolo, urlFoto, sonoIo }: Props) {
  const [inCorso, avvia] = useTransition();
  const [conferma, setConferma] = useState(false);

  function esegui(azione: () => Promise<{ errore?: string; ok?: string } | undefined>) {
    avvia(async () => {
      const esito = await azione();
      if (esito?.errore) toast.error(esito.errore);
      else if (esito?.ok) toast.success(esito.ok);
      setConferma(false);
    });
  }

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar nome={nome} url={urlFoto} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">
            {nome}
            {sonoIo && <span className="ml-2 text-base font-normal text-muted-foreground">(tu)</span>}
          </p>
          <p className="truncate text-muted-foreground">{ruoloCucina || "Ruolo non indicato"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={ruolo === "admin" ? "default" : "outline"}
          disabled={inCorso}
          aria-pressed={ruolo === "admin"}
          onClick={() => esegui(() => cambiaRuolo(id, ruolo === "admin" ? "staff" : "admin"))}
        >
          {ruolo === "admin" ? "Admin ✓" : "Rendi Admin"}
        </Button>

        {conferma ? (
          <Button type="button" variant="destructive" disabled={inCorso} onClick={() => esegui(() => rimuoviMembro(id))}>
            Sì, rimuovi
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={inCorso || sonoIo} onClick={() => setConferma(true)}>
            Rimuovi
          </Button>
        )}
      </div>
      {conferma && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground">Non potrà più vedere il magazzino.</p>
          <Button type="button" variant="ghost" onClick={() => setConferma(false)}>
            Annulla
          </Button>
        </div>
      )}
    </li>
  );
}
