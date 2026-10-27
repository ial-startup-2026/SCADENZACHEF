"use client";

import { useState } from "react";
import { CircleCheck, Loader2, TriangleAlert } from "lucide-react";
import { AvvisoAllergeni } from "@/components/avviso-allergeni";
import { Campo } from "@/components/campo";
import { GruppoChip } from "@/components/gruppo-chip";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { ALLERGENI, type CodiceAllergene } from "@/lib/costanti/allergeni";
import { CATEGORIE } from "@/lib/costanti/categorie";
import { POSIZIONI } from "@/lib/costanti/posizioni";
import { UNITA } from "@/lib/costanti/unita";
import { PASSO_PER_UNITA } from "@/lib/quantita";
import { schemaNuovoProdotto } from "@/lib/scadenze/schemi";
import { giorniAllaScadenza } from "@/lib/scadenze/stato-scadenza";
import { preferenzeCorrenti, salvaPreferenze } from "@/lib/scan/preferenze";
import { MESSAGGI_FALLIMENTO, type DatiNuovoProdotto, type EsitoLettura } from "@/lib/scan/tipi";
import { valutaLettura } from "@/lib/scan/valutazione";

type Props = {
  /** `null` = si compila tutto a mano (nessuna foto letta). */
  esito: EsitoLettura | null;
  anteprima: string | null;
  /** Restituisce un messaggio d'errore, oppure `null` se il salvataggio è riuscito. */
  onSalva: (dati: DatiNuovoProdotto) => Promise<string | null>;
  onRifai: () => void;
};

/** Messaggio in alto: dice con chiarezza cosa è successo con la lettura. */
function Esito({ esito }: { esito: EsitoLettura | null }) {
  if (!esito) {
    return (
      <p role="status" className="rounded-2xl bg-secondary p-3 text-base">
        Compila i dati del prodotto.
      </p>
    );
  }
  if (!esito.ok) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-destructive p-3 text-base font-semibold text-destructive">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>{MESSAGGI_FALLIMENTO[esito.motivo]} Compila i dati a mano.</span>
      </p>
    );
  }
  const { bassaConfidenza } = valutaLettura(esito.lettura);
  return bassaConfidenza ? (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-accento bg-accent p-3 text-base font-semibold text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>Non sono sicuro di alcuni dati. Controlla i campi segnati prima di salvare.</span>
    </p>
  ) : (
    <p role="status" className="flex items-start gap-2 rounded-2xl bg-secondary p-3 text-base font-semibold">
      <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>Letto. Controlla e salva.</span>
    </p>
  );
}

export function ModuloConferma({ esito, anteprima, onSalva, onRifai }: Props) {
  const lettura = esito?.ok ? esito.lettura : null;
  const dubbi = lettura ? valutaLettura(lettura).daControllare : new Set<string>();
  const [prefs] = useState(preferenzeCorrenti);

  const [clientUuid] = useState(() => crypto.randomUUID());
  const [nome, setNome] = useState(lettura?.nome ?? "");
  const [scadenza, setScadenza] = useState(lettura?.data_scadenza ?? "");
  const [quantita, setQuantita] = useState(lettura?.quantita ?? 1);
  const [unita, setUnita] = useState(lettura?.unita ?? "pz");
  const [posizione, setPosizione] = useState(prefs.posizione);
  const [categoria, setCategoria] = useState(prefs.categoria);
  const [lotto, setLotto] = useState(lettura?.lotto ?? "");
  const [allergeni, setAllergeni] = useState<CodiceAllergene[]>(lettura?.allergeni ?? []);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function salva() {
    const dati = {
      clientUuid,
      nome,
      categoria,
      posizione,
      quantita,
      unita,
      data_scadenza: scadenza,
      lotto: lotto.trim() === "" ? null : lotto,
      allergeni,
    };
    // Stesse regole del server: così gli errori si vedono subito, prima di aspettare la rete.
    const controllo = schemaNuovoProdotto.safeParse({ ...dati, fotoPath: null });
    if (!controllo.success) {
      setErrore(controllo.error.issues[0]?.message ?? "Controlla i dati.");
      return;
    }
    setInCorso(true);
    setErrore(null);
    const messaggio = await onSalva({ ...dati, nome: controllo.data.nome, lotto: controllo.data.lotto });
    setInCorso(false);
    if (messaggio) setErrore(messaggio);
    else salvaPreferenze({ posizione, categoria });
  }

  const giaPassata = /^\d{4}-\d{2}-\d{2}$/.test(scadenza) && giorniAllaScadenza(scadenza, new Date()) < 0;
  const toggleAllergene = (a: CodiceAllergene) =>
    setAllergeni((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  return (
    <form
      // Gli errori li scrive l'app (stesse regole del server, in italiano, nella pagina): niente popup del browser.
      noValidate
      className="space-y-5 pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        void salva();
      }}
    >
      <div className="flex items-start gap-3">
        {anteprima && (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima locale (blob): next/image non serve
          <img src={anteprima} alt="La foto dell'etichetta" className="size-20 shrink-0 rounded-2xl object-cover" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Esito esito={esito} />
          {esito?.ok && esito.origine === "prova" && (
            <p className="text-base text-muted-foreground">Lettura di prova: i dati sono finti.</p>
          )}
        </div>
      </div>

      <Campo etichetta="Nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} dubbio={dubbi.has("nome")} maxLength={120} autoComplete="off" required />
      <Campo
        etichetta="Scadenza"
        name="scadenza"
        type="date"
        value={scadenza}
        onChange={(e) => setScadenza(e.target.value)}
        dubbio={dubbi.has("data_scadenza")}
        suggerimento={giaPassata ? "Questa data è già passata: il prodotto risulterà scaduto." : undefined}
        required
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Quantità</h2>
          {dubbi.has("quantita") && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-accent-foreground">Da controllare</span>
          )}
        </div>
        <Stepper etichetta="Quantità" valore={quantita} onChange={setQuantita} min={0.001} max={1_000_000} unita={unita} passo={PASSO_PER_UNITA[unita]} formatta={(n) => String(n).replace(".", ",")} modificabile />
        <GruppoChip etichetta="Unità di misura" voci={UNITA.map((u) => ({ valore: u.codice, etichetta: u.etichetta }))} selezionati={[unita]} onToggle={setUnita} />
        {lettura?.quantita != null && lettura.unita && (
          <p className="text-base text-muted-foreground">
            Sull&apos;etichetta: {String(lettura.quantita).replace(".", ",")} {lettura.unita}. Scrivi qui quanto ne stai aggiungendo.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Dove lo metti</h2>
        <GruppoChip etichetta="Posizione" voci={POSIZIONI.map((p) => ({ valore: p.codice, etichetta: p.etichetta }))} selezionati={[posizione]} onToggle={setPosizione} />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Categoria</h2>
        <GruppoChip etichetta="Categoria" voci={CATEGORIE.map((c) => ({ valore: c.codice, etichetta: c.etichetta }))} selezionati={[categoria]} onToggle={setCategoria} />
      </section>

      <Campo etichetta="Lotto (facoltativo)" name="lotto" value={lotto} onChange={(e) => setLotto(e.target.value)} dubbio={dubbi.has("lotto")} maxLength={60} autoComplete="off" />

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Allergeni</h2>
          {dubbi.has("allergeni") && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-accent-foreground">Da controllare</span>
          )}
        </div>
        {dubbi.has("allergeni") && (
          <p className="text-base font-semibold">Non ho letto bene gli ingredienti: l&apos;elenco può essere incompleto. Controlla l&apos;etichetta.</p>
        )}
        <GruppoChip etichetta="Allergeni" voci={ALLERGENI.map((a) => ({ valore: a.codice, etichetta: a.etichetta }))} selezionati={allergeni} onToggle={toggleAllergene} />
        <AvvisoAllergeni />
      </section>

      {errore && (
        <p role="alert" className="rounded-xl border-2 border-destructive px-4 py-3 font-semibold text-destructive">
          {errore}
        </p>
      )}

      {/* Barra in basso, a portata di pollice: salvare è sempre a un tocco. */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr] gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onRifai} disabled={inCorso}>
            Rifai
          </Button>
          <Button type="submit" size="lg" disabled={inCorso} aria-busy={inCorso}>
            {inCorso && <Loader2 className="animate-spin" aria-hidden />}
            Salva in magazzino
          </Button>
        </div>
      </div>
    </form>
  );
}
