import type { ProdottoMagazzino } from "@/lib/supabase/tipi";

export type StatoProdotto = ProdottoMagazzino["stato"];
export type Errore = { ok: false; errore: string };

export type EsitoScarico =
  | { ok: true; movimentoId: string; quantita: number; stato: StatoProdotto }
  | Errore;
export type EsitoAnnulla = { ok: true; quantita: number; stato: StatoProdotto } | Errore;
export type EsitoModifica = { ok: true; prodotto: ProdottoMagazzino } | Errore;
