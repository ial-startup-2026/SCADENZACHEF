"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, Images, Loader2, PencilLine, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  iscriviPreferenze,
  preferenzeCorrenti,
  preferenzeServer,
  salvaPreferenze,
} from "@/lib/scan/preferenze";
import type { DatiNuovoProdotto, EsitoLettura, ServiziScansione } from "@/lib/scan/tipi";
import { cn } from "@/lib/utils";
import { ModuloConferma } from "./modulo-conferma";

type Fase =
  | { tipo: "cattura" }
  | { tipo: "lettura"; anteprima: string; foto: Blob }
  | { tipo: "conferma"; foto: Blob | null; anteprima: string | null; esito: EsitoLettura | null; chiave: number };

type Props = {
  servizi: ServiziScansione;
  /** Dove andare dopo il salvataggio (se la scansione continua è spenta). */
  destinazione?: string;
};

export function Scansione({ servizi, destinazione = "/magazzino" }: Props) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>({ tipo: "cattura" });
  const [aggiunti, setAggiunti] = useState<string[]>([]);
  const prefs = useSyncExternalStore(iscriviPreferenze, preferenzeCorrenti, preferenzeServer);

  const fotocamera = useRef<HTMLInputElement>(null);
  const galleria = useRef<HTMLInputElement>(null);
  // Ogni nuova foto ha un numero: la risposta di una lettura abbandonata si scarta.
  const sessione = useRef(0);
  const richiesta = useRef<AbortController | null>(null);

  // Libera l'anteprima (un URL temporaneo della foto) quando non serve più.
  const urlAnteprima = fase.tipo === "cattura" ? null : fase.anteprima;
  useEffect(() => {
    return () => {
      if (urlAnteprima) URL.revokeObjectURL(urlAnteprima);
    };
  }, [urlAnteprima]);

  async function suFoto(file: File | undefined) {
    if (!file) return;
    const mia = ++sessione.current;
    let foto: Blob;
    try {
      foto = await servizi.comprimi(file);
    } catch {
      toast.error("Non riesco a usare questa foto. Riprova con un'altra.");
      return;
    }
    if (mia !== sessione.current) return;
    const anteprima = URL.createObjectURL(foto);
    setFase({ tipo: "lettura", anteprima, foto });

    const controllo = new AbortController();
    richiesta.current = controllo;
    const esito = await servizi.leggi(foto, controllo.signal);
    if (mia !== sessione.current) return; // nel frattempo si è scelto di scrivere a mano o di annullare

    if (esito.ok) {
      try {
        navigator.vibrate?.(40);
      } catch {
        // Non tutti i telefoni vibrano: nessun problema.
      }
    }
    setFase({ tipo: "conferma", foto, anteprima, esito, chiave: mia });
  }

  /** Lascia perdere la lettura in corso (se c'è). */
  function abbandona() {
    sessione.current++;
    richiesta.current?.abort();
    richiesta.current = null;
  }

  function scriviAMano(foto: Blob | null, anteprima: string | null) {
    abbandona();
    setFase({ tipo: "conferma", foto, anteprima, esito: null, chiave: sessione.current });
  }

  function ricomincia() {
    abbandona();
    setFase({ tipo: "cattura" });
  }

  async function salva(dati: DatiNuovoProdotto, foto: Blob | null): Promise<string | null> {
    const esito = await servizi.salva(dati, foto);
    if (!esito.ok) return esito.errore;

    toast.success(`${dati.nome}: aggiunto al magazzino`);
    if (esito.avviso) toast.warning(esito.avviso);
    if (prefs.continua) {
      setAggiunti((cur) => [...cur, dati.nome]);
      setFase({ tipo: "cattura" });
    } else {
      router.push(destinazione);
    }
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-4xl font-medium leading-[1.1] tracking-tight">Scansiona</h1>
        <Link
          href="/"
          aria-label="Chiudi"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card shadow-carta"
        >
          <X className="size-6" aria-hidden />
        </Link>
      </header>

      {fase.tipo === "cattura" && (
        <section className="space-y-4">
          <div className="animazione-entra space-y-4 rounded-carta bg-card p-6 text-center shadow-carta">
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
              <Camera className="size-10" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-2xl font-medium tracking-tight">Inquadra l&apos;etichetta</h2>
              <p className="text-muted-foreground">Con la data di scadenza e gli ingredienti ben visibili, con buona luce.</p>
            </div>
            <Button type="button" size="lg" variant="accento" className="min-h-16 w-full text-xl" onClick={() => fotocamera.current?.click()}>
              <Camera aria-hidden />
              Scatta una foto
            </Button>
            <Button type="button" size="lg" variant="secondary" className="w-full" onClick={() => galleria.current?.click()}>
              <Images aria-hidden />
              Scegli dalla galleria
            </Button>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={prefs.continua}
            onClick={() => salvaPreferenze({ continua: !prefs.continua })}
            className="flex min-h-16 w-full items-center justify-between gap-4 rounded-carta bg-card p-4 text-left shadow-carta"
          >
            <span>
              <span className="block text-lg font-semibold">Scansione continua</span>
              <span className="block text-base text-muted-foreground">Dopo ogni salvataggio resti qui, pronto per il prodotto dopo.</span>
            </span>
            <span
              aria-hidden
              className={cn("flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors", prefs.continua ? "bg-accento" : "bg-input")}
            >
              <span className={cn("flex size-7 items-center justify-center rounded-full bg-white text-accento transition-transform", prefs.continua && "translate-x-7")}>
                {prefs.continua && <Check className="size-4" />}
              </span>
            </span>
          </button>

          <Button type="button" variant="ghost" size="lg" className="w-full" onClick={() => scriviAMano(null, null)}>
            <PencilLine aria-hidden />
            Inserisci a mano, senza foto
          </Button>

          {aggiunti.length > 0 && (
            <p role="status" className="rounded-2xl bg-secondary p-3 text-base">
              <span className="font-semibold">
                Aggiunti in questa sessione ({aggiunti.length}):
              </span>{" "}
              {aggiunti.join(", ")}
            </p>
          )}

          {/* Due ingressi: la fotocamera (su telefono) e la galleria. */}
          <input ref={fotocamera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void suFoto(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={galleria} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void suFoto(e.target.files?.[0]); e.target.value = ""; }} />
        </section>
      )}

      {fase.tipo === "lettura" && (
        <section className="animazione-entra space-y-4 rounded-carta bg-card p-6 text-center shadow-carta" aria-live="polite">
          {/* eslint-disable-next-line @next/next/no-img-element -- anteprima locale (blob): next/image non serve */}
          <img src={fase.anteprima} alt="La foto dell'etichetta" className="mx-auto max-h-64 rounded-2xl object-contain" />
          <p className="flex items-center justify-center gap-2 text-xl font-medium">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            Sto leggendo l&apos;etichetta…
          </p>
          <p className="text-muted-foreground">Di solito bastano pochi secondi.</p>
          <div className="grid gap-2">
            <Button type="button" size="lg" variant="secondary" onClick={() => scriviAMano(fase.foto, fase.anteprima)}>
              <PencilLine aria-hidden />
              Scrivi a mano
            </Button>
            <Button type="button" size="lg" variant="ghost" onClick={ricomincia}>
              Annulla
            </Button>
          </div>
        </section>
      )}

      {fase.tipo === "conferma" && (
        <ModuloConferma
          key={fase.chiave}
          esito={fase.esito}
          anteprima={fase.anteprima}
          onSalva={(dati) => salva(dati, fase.foto)}
          onRifai={ricomincia}
        />
      )}
    </main>
  );
}
