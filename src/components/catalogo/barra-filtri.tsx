"use client";

import { useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Foglio } from "@/components/foglio";
import { GruppoChip } from "@/components/gruppo-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALLERGENI } from "@/lib/costanti/allergeni";
import { CATEGORIE } from "@/lib/costanti/categorie";
import { POSIZIONI } from "@/lib/costanti/posizioni";
import { FILTRI_VUOTI, type Filtri, type FiltroStato } from "@/lib/scadenze/catalogo";
import { cn } from "@/lib/utils";

type Props = { filtri: Filtri; onChange: (filtri: Filtri) => void };

const STATI: { valore: FiltroStato; etichetta: string }[] = [
  { valore: "tutti", etichetta: "Tutti" },
  { valore: "presto", etichetta: "Scade presto" },
  { valore: "scaduti", etichetta: "Scaduti" },
];

function Chip({
  attivo,
  onClick,
  children,
  conMenu,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  conMenu?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={attivo}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold active:scale-95",
        attivo ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground",
      )}
    >
      {attivo && !conMenu && <Check className="size-5" aria-hidden />}
      {children}
      {conMenu && <ChevronDown className="size-5" aria-hidden />}
    </button>
  );
}

const alterna = <T,>(lista: readonly T[], v: T): T[] => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Ricerca e chip di filtro. Resta in alto mentre si scorre la lista. */
export function BarraFiltri({ filtri, onChange }: Props) {
  const [foglio, setFoglio] = useState<"categoria" | "allergene" | null>(null);
  const imposta = (parziale: Partial<Filtri>) => onChange({ ...filtri, ...parziale });

  return (
    <div className="sticky top-0 z-30 -mx-4 space-y-3 bg-background/95 px-4 pb-3 pt-2 backdrop-blur">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          inputMode="search"
          aria-label="Cerca un prodotto"
          placeholder="Cerca un prodotto"
          value={filtri.ricerca}
          onChange={(e) => imposta({ ricerca: e.target.value })}
          className="pl-12 pr-12"
          autoComplete="off"
        />
        {filtri.ricerca && (
          <button
            type="button"
            aria-label="Cancella la ricerca"
            onClick={() => imposta({ ricerca: "" })}
            className="absolute right-1 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full"
          >
            <X className="size-6" aria-hidden />
          </button>
        )}
      </div>

      {/* Scorrimento orizzontale: le chip non vanno a capo, così la barra resta bassa. */}
      <div role="group" aria-label="Filtri" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {STATI.map(({ valore, etichetta }) => (
          <Chip key={valore} attivo={filtri.stato === valore} onClick={() => imposta({ stato: valore })}>
            {etichetta}
          </Chip>
        ))}
        <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />
        {POSIZIONI.map(({ codice, etichetta }) => (
          <Chip key={codice} attivo={filtri.posizioni.includes(codice)} onClick={() => imposta({ posizioni: alterna(filtri.posizioni, codice) })}>
            {etichetta}
          </Chip>
        ))}
        <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />
        <Chip conMenu attivo={filtri.categorie.length > 0} onClick={() => setFoglio("categoria")}>
          Categoria{filtri.categorie.length > 0 && ` (${filtri.categorie.length})`}
        </Chip>
        <Chip conMenu attivo={filtri.senzaAllergeni.length > 0} onClick={() => setFoglio("allergene")}>
          Senza allergene{filtri.senzaAllergeni.length > 0 && ` (${filtri.senzaAllergeni.length})`}
        </Chip>
      </div>

      <Foglio aperto={foglio === "categoria"} onChiudi={() => setFoglio(null)} titolo="Categoria" descrizione="Mostra solo queste categorie.">
        <div className="space-y-4">
          <GruppoChip
            etichetta="Categorie"
            voci={CATEGORIE.map((c) => ({ valore: c.codice, etichetta: c.etichetta }))}
            selezionati={filtri.categorie}
            onToggle={(c) => imposta({ categorie: alterna(filtri.categorie, c) })}
          />
          <Button size="lg" className="w-full" onClick={() => setFoglio(null)}>
            Fatto
          </Button>
          {filtri.categorie.length > 0 && (
            <Button size="lg" variant="ghost" className="w-full" onClick={() => imposta({ categorie: [] })}>
              Togli la selezione
            </Button>
          )}
        </div>
      </Foglio>

      <Foglio
        aperto={foglio === "allergene"}
        onChiudi={() => setFoglio(null)}
        titolo="Senza allergene"
        descrizione="Nascondi i prodotti che contengono ciò che scegli."
      >
        <div className="space-y-4">
          <GruppoChip
            etichetta="Allergeni da escludere"
            voci={ALLERGENI.map((a) => ({ valore: a.codice, etichetta: a.etichetta }))}
            selezionati={filtri.senzaAllergeni}
            onToggle={(a) => imposta({ senzaAllergeni: alterna(filtri.senzaAllergeni, a) })}
          />
          <Button size="lg" className="w-full" onClick={() => setFoglio(null)}>
            Fatto
          </Button>
          {filtri.senzaAllergeni.length > 0 && (
            <Button size="lg" variant="ghost" className="w-full" onClick={() => imposta({ senzaAllergeni: [] })}>
              Togli la selezione
            </Button>
          )}
        </div>
      </Foglio>
    </div>
  );
}

export { FILTRI_VUOTI };
