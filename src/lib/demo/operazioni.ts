import { messaggioErrore } from "@/lib/errori";
import { arrotonda } from "@/lib/quantita";
import type { EsitoAnnulla, EsitoModifica, EsitoScarico } from "@/lib/scadenze/esiti";
import type { DatiModificaProdotto, InputScarico } from "@/lib/scadenze/schemi";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";

/** Prodotti e movimenti tenuti in memoria al posto del database. */
export type Registro = {
  prodotti: ProdottoMagazzino[];
  movimenti: Map<string, { prodottoId: string; quantita: number }>;
};

/** Stessa regola di `scarica_prodotto` nel database, su un registro in memoria. */
export function scaricaSu(registro: Registro, input: InputScarico): EsitoScarico {
  const p = registro.prodotti.find((x) => x.id === input.prodottoId);
  if (!p) return { ok: false, errore: messaggioErrore({ message: "prodotto_non_trovato" }) };
  if (p.stato !== "attivo") return { ok: false, errore: messaggioErrore({ message: "prodotto_non_attivo" }) };

  const q = input.quantita ?? p.quantita;
  if (q <= 0 || q > p.quantita) return { ok: false, errore: messaggioErrore({ message: "quantita_non_valida" }) };

  p.quantita = arrotonda(p.quantita - q);
  p.stato = p.quantita > 0 ? "attivo" : input.tipo === "spreco" ? "buttato" : "finito";
  const movimentoId = crypto.randomUUID();
  registro.movimenti.set(movimentoId, { prodottoId: p.id, quantita: q });
  return { ok: true, movimentoId, quantita: p.quantita, stato: p.stato };
}

/** Stessa regola di `annulla_movimento`: la quantità torna sul prodotto, che torna attivo. */
export function annullaSu(registro: Registro, movimentoId: string): EsitoAnnulla {
  const m = registro.movimenti.get(movimentoId);
  const p = m && registro.prodotti.find((x) => x.id === m.prodottoId);
  if (!m || !p) return { ok: false, errore: messaggioErrore({ message: "movimento_non_trovato" }) };

  registro.movimenti.delete(movimentoId);
  p.quantita = arrotonda(p.quantita + m.quantita);
  p.stato = "attivo";
  return { ok: true, quantita: p.quantita, stato: p.stato };
}

/** Modifica dei soli dati descrittivi (mai quantità o stato). */
export function modificaSu(registro: Registro, prodottoId: string, dati: DatiModificaProdotto): EsitoModifica {
  const p = registro.prodotti.find((x) => x.id === prodottoId);
  if (!p) return { ok: false, errore: messaggioErrore({ message: "prodotto_non_trovato" }) };
  Object.assign(p, dati);
  return { ok: true, prodotto: { ...p } };
}
