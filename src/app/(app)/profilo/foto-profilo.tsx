"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ridimensionaImmagine } from "@/lib/immagini";
import { creaClientBrowser } from "@/lib/supabase/client";

type Props = { utenteId: string; localeId: string; /** Modalità demo: nessun archivio per le foto. */ nonDisponibile?: boolean };

/** Scatta o scegli una foto: viene ritagliata a quadrato, ridotta a 256px e caricata. */
export function CambiaFotoProfilo({ utenteId, localeId, nonDisponibile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [inCorso, setInCorso] = useState(false);
  const router = useRouter();

  async function suScelta(file: File | undefined) {
    if (!file) return;
    if (nonDisponibile) {
      toast.info("In modalità demo la foto non si può salvare.");
      return;
    }
    setInCorso(true);
    try {
      const immagine = await ridimensionaImmagine(file, { latoMax: 256, qualita: 0.85, quadrata: true });
      const supabase = creaClientBrowser();
      const percorso = `${localeId}/${utenteId}.jpg`;
      const { error: erroreCaricamento } = await supabase.storage
        .from("avatar")
        .upload(percorso, immagine, { upsert: true, contentType: "image/jpeg" });
      if (erroreCaricamento) throw erroreCaricamento;
      const { error: erroreProfilo } = await supabase.from("profili").update({ foto_url: percorso }).eq("id", utenteId);
      if (erroreProfilo) throw erroreProfilo;
      toast.success("Foto aggiornata.");
      router.refresh();
    } catch {
      toast.error("Non sono riuscito a caricare la foto. Riprova.");
    } finally {
      setInCorso(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => suScelta(e.target.files?.[0])} />
      <Button type="button" variant="outline" disabled={inCorso} onClick={() => input.current?.click()}>
        {inCorso ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
        Cambia foto
      </Button>
    </>
  );
}
