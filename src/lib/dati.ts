import { creaClientServer } from "@/lib/supabase/server";
import { COLONNE_PRODOTTO, type ProdottoMagazzino } from "@/lib/supabase/tipi";
import { SOGLIE_DEFAULT, type Soglie } from "@/lib/scadenze/soglie";

export type Magazzino =
  | { errore: false; prodotti: ProdottoMagazzino[]; soglie: Soglie }
  | { errore: true };

/**
 * Prodotti attivi del locale (in ordine FEFO) e soglie del semaforo.
 * Se una delle due letture fallisce si segnala l'errore: mostrare colori calcolati con soglie
 * sbagliate sarebbe peggio di non mostrare nulla.
 */
export async function caricaMagazzino(): Promise<Magazzino> {
  const supabase = await creaClientServer();
  const [prodotti, impostazioni] = await Promise.all([
    supabase
      .from("prodotti_magazzino")
      .select(COLONNE_PRODOTTO)
      .eq("stato", "attivo")
      .order("data_scadenza", { ascending: true })
      .order("creato_il", { ascending: true })
      .returns<ProdottoMagazzino[]>(),
    supabase
      .from("impostazioni_locale")
      .select("soglia_giallo, soglia_arancione")
      .maybeSingle<{ soglia_giallo: number; soglia_arancione: number }>(),
  ]);
  if (prodotti.error || impostazioni.error) return { errore: true };

  return {
    errore: false,
    // `numeric` può arrivare come stringa: si converte una volta sola, qui.
    prodotti: (prodotti.data ?? []).map((p) => ({ ...p, quantita: Number(p.quantita) })),
    soglie: impostazioni.data
      ? { giallo: impostazioni.data.soglia_giallo, arancione: impostazioni.data.soglia_arancione }
      : SOGLIE_DEFAULT,
  };
}
