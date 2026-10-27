"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Campo } from "@/components/campo";
import { Foglio } from "@/components/foglio";
import { GruppoChip } from "@/components/gruppo-chip";
import { Button } from "@/components/ui/button";
import { ALLERGENI, type CodiceAllergene } from "@/lib/costanti/allergeni";
import { CATEGORIE } from "@/lib/costanti/categorie";
import { POSIZIONI } from "@/lib/costanti/posizioni";
import { UNITA } from "@/lib/costanti/unita";
import type { DatiModificaProdotto } from "@/lib/scadenze/schemi";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";

export type DatiModifica = Omit<DatiModificaProdotto, "lotto"> & { lotto: string | null };

type Props = {
  prodotto: ProdottoMagazzino | null;
  onChiudi: () => void;
  /** Restituisce un messaggio d'errore, oppure `null` se è andata a buon fine. */
  onSalva: (p: ProdottoMagazzino, dati: DatiModifica) => Promise<string | null>;
};

export function FoglioModifica({ prodotto, onChiudi, onSalva }: Props) {
  return (
    <Foglio aperto={prodotto !== null} onChiudi={onChiudi} titolo="Modifica" descrizione={prodotto?.nome}>
      {prodotto && <Modulo key={prodotto.id} prodotto={prodotto} onSalva={onSalva} onChiudi={onChiudi} />}
    </Foglio>
  );
}

function Modulo({
  prodotto,
  onSalva,
  onChiudi,
}: {
  prodotto: ProdottoMagazzino;
  onSalva: Props["onSalva"];
  onChiudi: () => void;
}) {
  const [nome, setNome] = useState(prodotto.nome);
  const [scadenza, setScadenza] = useState(prodotto.data_scadenza);
  const [posizione, setPosizione] = useState(prodotto.posizione);
  const [categoria, setCategoria] = useState(prodotto.categoria);
  const [unita, setUnita] = useState(prodotto.unita);
  const [lotto, setLotto] = useState(prodotto.lotto ?? "");
  const [allergeni, setAllergeni] = useState<CodiceAllergene[]>(prodotto.allergeni);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function salva() {
    setInCorso(true);
    setErrore(null);
    const messaggio = await onSalva(prodotto, {
      nome,
      data_scadenza: scadenza,
      posizione,
      categoria,
      unita,
      lotto: lotto.trim() === "" ? null : lotto,
      allergeni,
    });
    setInCorso(false);
    if (messaggio) setErrore(messaggio);
    else onChiudi();
  }

  const toggleAllergene = (a: CodiceAllergene) =>
    setAllergeni((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void salva();
      }}
    >
      <Campo etichetta="Nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} required />
      <Campo etichetta="Scadenza" name="scadenza" type="date" value={scadenza} onChange={(e) => setScadenza(e.target.value)} required />

      <fieldset className="space-y-2">
        <legend className="text-base font-semibold">Dove si trova</legend>
        <GruppoChip etichetta="Posizione" voci={POSIZIONI.map((p) => ({ valore: p.codice, etichetta: p.etichetta }))} selezionati={[posizione]} onToggle={setPosizione} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-base font-semibold">Categoria</legend>
        <GruppoChip etichetta="Categoria" voci={CATEGORIE.map((c) => ({ valore: c.codice, etichetta: c.etichetta }))} selezionati={[categoria]} onToggle={setCategoria} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-base font-semibold">Unità di misura</legend>
        <GruppoChip etichetta="Unità" voci={UNITA.map((u) => ({ valore: u.codice, etichetta: u.etichetta }))} selezionati={[unita]} onToggle={setUnita} />
      </fieldset>

      <Campo etichetta="Lotto (facoltativo)" name="lotto" value={lotto} onChange={(e) => setLotto(e.target.value)} maxLength={60} autoComplete="off" />

      <fieldset className="space-y-2">
        <legend className="text-base font-semibold">Allergeni</legend>
        <GruppoChip etichetta="Allergeni" voci={ALLERGENI.map((a) => ({ valore: a.codice, etichetta: a.etichetta }))} selezionati={allergeni} onToggle={toggleAllergene} />
      </fieldset>

      {errore && (
        <p role="alert" className="rounded-xl border-2 border-destructive px-4 py-3 font-semibold text-destructive">
          {errore}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={inCorso} aria-busy={inCorso}>
        {inCorso && <Loader2 className="animate-spin" aria-hidden />}
        Salva
      </Button>
    </form>
  );
}
