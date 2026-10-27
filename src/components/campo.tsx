"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { useValoriModulo } from "@/lib/contesto-modulo";

type Props = React.ComponentProps<typeof Input> & {
  etichetta: string;
  suggerimento?: string;
};

/** Etichetta sempre visibile + campo: in cucina non ci si affida ai segnaposto. */
export function Campo({ etichetta, suggerimento, id, name, defaultValue, ...props }: Props) {
  const valori = useValoriModulo();
  const idCampo = id ?? name;
  const valoreIniziale = (name && valori?.[name]) ?? defaultValue;
  return (
    <div className="space-y-1.5">
      <label htmlFor={idCampo} className="block text-base font-semibold">
        {etichetta}
      </label>
      <Input
        id={idCampo}
        name={name}
        defaultValue={valoreIniziale}
        // Cambiando la chiave il campo si rimonta con il valore rimandato dal server.
        key={valori ? `${name}:${valori[name ?? ""] ?? ""}` : undefined}
        aria-describedby={suggerimento ? `${idCampo}-info` : undefined}
        {...props}
      />
      {suggerimento && (
        <p id={`${idCampo}-info`} className="text-sm text-muted-foreground">
          {suggerimento}
        </p>
      )}
    </div>
  );
}
