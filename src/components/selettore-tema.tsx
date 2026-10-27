"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  impostaTema,
  iscriviTema,
  temaCorrente,
  temaServer,
  type Tema,
} from "@/lib/tema";

const OPZIONI: { valore: Tema; etichetta: string; icona: LucideIcon }[] = [
  { valore: "sistema", etichetta: "Auto", icona: Monitor },
  { valore: "chiaro", etichetta: "Chiaro", icona: Sun },
  { valore: "scuro", etichetta: "Scuro", icona: Moon },
];

export function SelettoreTema() {
  const tema = useSyncExternalStore(iscriviTema, temaCorrente, temaServer);

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
      {OPZIONI.map(({ valore, etichetta, icona: Icona }) => {
        const scelto = tema === valore;
        return (
          <button
            key={valore}
            type="button"
            role="radio"
            aria-checked={scelto}
            onClick={() => impostaTema(valore)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-base font-semibold",
              scelto
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground",
            )}
          >
            <Icona className="size-5" aria-hidden />
            {etichetta}
          </button>
        );
      })}
    </div>
  );
}
