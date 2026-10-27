"use client";

import * as React from "react";
import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useValoriModulo } from "@/lib/contesto-modulo";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input> & {
  etichetta: string;
  suggerimento?: string;
  /** Campo letto con poca sicurezza: si invita a ricontrollarlo (testo + icona, mai solo colore). */
  dubbio?: boolean;
};

/** Etichetta sempre visibile + campo: in cucina non ci si affida ai segnaposto. */
export function Campo({ etichetta, suggerimento, dubbio, id, name, defaultValue, className, ...props }: Props) {
  const valori = useValoriModulo();
  const idCampo = id ?? name;
  const valoreIniziale = (name && valori?.[name]) ?? defaultValue;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={idCampo} className="block text-base font-semibold">
          {etichetta}
        </label>
        {dubbio && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-accent-foreground">
            <CircleHelp className="size-4" aria-hidden />
            Da controllare
          </span>
        )}
      </div>
      <Input
        id={idCampo}
        name={name}
        defaultValue={valoreIniziale}
        // Cambiando la chiave il campo si rimonta con il valore rimandato dal server.
        key={valori ? `${name}:${valori[name ?? ""] ?? ""}` : undefined}
        aria-describedby={suggerimento ? `${idCampo}-info` : undefined}
        className={cn(dubbio && "border-accento", className)}
        {...props}
      />
      {suggerimento && (
        <p id={`${idCampo}-info`} className="text-base text-muted-foreground">
          {suggerimento}
        </p>
      )}
    </div>
  );
}
