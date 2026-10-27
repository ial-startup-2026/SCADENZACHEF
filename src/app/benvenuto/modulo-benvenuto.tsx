"use client";

import { useState } from "react";
import { Campo } from "@/components/campo";
import { CampoRuoloCucina } from "@/components/campo-ruolo-cucina";
import { ModuloAzione } from "@/components/modulo-azione";
import { cn } from "@/lib/utils";
import { creaLocale, entraNelLocale } from "./azioni";

type Modo = "codice" | "nuovo";

export function ModuloBenvenuto({ codiceIniziale }: { codiceIniziale: string }) {
  const [modo, setModo] = useState<Modo>("codice");

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Come vuoi iniziare" className="grid grid-cols-2 gap-2">
        {(
          [
            ["codice", "Ho un codice"],
            ["nuovo", "Nuovo locale"],
          ] as const
        ).map(([valore, etichetta]) => (
          <button
            key={valore}
            type="button"
            role="radio"
            aria-checked={modo === valore}
            onClick={() => setModo(valore)}
            className={cn(
              "min-h-14 rounded-xl border-2 text-base font-semibold",
              modo === valore ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
            )}
          >
            {etichetta}
          </button>
        ))}
      </div>

      {modo === "codice" ? (
        <ModuloAzione key="codice" azione={entraNelLocale} invio="Entra nel locale">
          <Campo
            etichetta="Codice del locale"
            name="codice"
            defaultValue={codiceIniziale}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={12}
            className="text-xl font-bold uppercase tracking-widest"
            suggerimento="Te lo dà il titolare o lo chef."
            required
          />
          <Campo etichetta="Il tuo nome" name="nome" autoComplete="given-name" maxLength={60} required />
          <CampoRuoloCucina idLista="ruoli-codice" />
        </ModuloAzione>
      ) : (
        <ModuloAzione key="nuovo" azione={creaLocale} invio="Crea il locale">
          <Campo etichetta="Nome del locale" name="nome_locale" maxLength={80} autoComplete="organization" required />
          <Campo etichetta="Il tuo nome" name="nome" autoComplete="given-name" maxLength={60} required />
          <CampoRuoloCucina idLista="ruoli-nuovo" />
          <p className="text-base text-muted-foreground">Sarai l&apos;Admin: potrai invitare la squadra con un codice.</p>
        </ModuloAzione>
      )}
    </div>
  );
}
