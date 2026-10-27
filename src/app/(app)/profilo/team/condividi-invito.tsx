"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { codice: string; link: string; nomeLocale: string };

export function CondividiInvito({ codice, link, nomeLocale }: Props) {
  const messaggio = `Entra in ${nomeLocale} su ScadenzaChef: apri ${link} (codice ${codice})`;

  async function copia(testo: string, conferma: string) {
    try {
      await navigator.clipboard.writeText(testo);
      toast.success(conferma);
    } catch {
      toast.error("Non sono riuscito a copiare. Selezionalo a mano.");
    }
  }

  async function condividi() {
    if (navigator.share) {
      try {
        await navigator.share({ text: messaggio });
      } catch {
        // L'utente ha chiuso il foglio di condivisione: nessun errore da mostrare.
      }
    } else {
      await copia(messaggio, "Messaggio copiato.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="rounded-2xl border-2 border-dashed border-input bg-card py-5 text-center font-mono text-4xl font-semibold tracking-[0.3em]" aria-label={`Codice ${codice.split("").join(" ")}`}>
        {codice}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => copia(codice, "Codice copiato.")}>
          <Copy aria-hidden />
          Copia codice
        </Button>
        <Button type="button" variant="outline" onClick={condividi}>
          <Share2 aria-hidden />
          Condividi
        </Button>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(messaggio)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        Invia su WhatsApp
      </a>
    </div>
  );
}
