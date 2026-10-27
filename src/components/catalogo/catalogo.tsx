"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, ScanLine, SearchX } from "lucide-react";
import { toast } from "sonner";
import { StatoVuoto } from "@/components/stato-vuoto";
import { Button, buttonVariants } from "@/components/ui/button";
import { arrotonda, formattaQuantita } from "@/lib/quantita";
import { FILTRI_VUOTI, filtraProdotti, haFiltriAttivi, type Filtri } from "@/lib/scadenze/catalogo";
import type { Soglie } from "@/lib/scadenze/soglie";
import type { EsitoAnnulla, EsitoModifica, EsitoScarico } from "@/lib/scadenze/esiti";
import type { ProdottoMagazzino } from "@/lib/supabase/tipi";
import { cn } from "@/lib/utils";
import { BarraFiltri } from "./barra-filtri";
import { CardProdotto } from "./card-prodotto";
import { FoglioAzioni } from "./foglio-azioni";
import { FoglioModifica, type DatiModifica } from "./foglio-modifica";
import { FoglioScarico, type ScaricoConfermato } from "./foglio-scarico";

/** Le azioni sul server, passate dall'esterno: la pagina vera usa le Server Action, l'anteprima dei dati finti. */
export type AzioniCatalogo = {
  scarica: (input: {
    clientUuid: string;
    prodottoId: string;
    tipo: "scarico" | "spreco";
    quantita: number | null;
    motivo: string | null;
  }) => Promise<EsitoScarico>;
  annulla: (movimentoId: string) => Promise<EsitoAnnulla>;
  modifica: (prodottoId: string, dati: DatiModifica) => Promise<EsitoModifica>;
};

type Props = {
  prodotti: ProdottoMagazzino[];
  soglie: Soglie;
  /** Istante del server (ISO): evita differenze tra server e browser al primo disegno. */
  adessoIso: string;
  azioni: AzioniCatalogo;
  filtriIniziali?: Partial<Filtri>;
};

/** Il browser aggiorna "adesso" ogni minuto: a mezzanotte gli stati cambiano senza ricaricare. */
function useAdesso(iniziale: string) {
  const [adesso, setAdesso] = useState(() => new Date(iniziale));
  useEffect(() => {
    const id = setInterval(() => setAdesso(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return adesso;
}

type Foglio =
  | { tipo: "azioni"; prodotto: ProdottoMagazzino }
  | { tipo: "usato" | "butta"; prodotto: ProdottoMagazzino }
  | { tipo: "modifica"; prodotto: ProdottoMagazzino }
  | null;

export function Catalogo({ prodotti: prodottiIniziali, soglie, adessoIso, azioni, filtriIniziali }: Props) {
  const adesso = useAdesso(adessoIso);
  const [prodotti, setProdotti] = useState(prodottiIniziali);
  const [prec, setPrec] = useState(prodottiIniziali);
  // Quando il server manda dati nuovi (dopo un salvataggio o un ricaricamento) si riparte da quelli.
  if (prec !== prodottiIniziali) {
    setPrec(prodottiIniziali);
    setProdotti(prodottiIniziali);
  }
  const [filtri, setFiltri] = useState<Filtri>({ ...FILTRI_VUOTI, ...filtriIniziali });
  const [foglio, setFoglio] = useState<Foglio>(null);

  const sostituisci = (id: string, parziale: Partial<ProdottoMagazzino>) =>
    setProdotti((cur) => cur.map((p) => (p.id === id ? { ...p, ...parziale } : p)));

  const attivi = prodotti.filter((p) => p.stato === "attivo");
  const visibili = filtraProdotti(prodotti, filtri, adesso, soglie);

  async function annulla(movimentoId: string, originale: ProdottoMagazzino) {
    const esito = await azioni.annulla(movimentoId);
    if (esito.ok) {
      sostituisci(originale.id, { quantita: esito.quantita, stato: esito.stato });
      toast.success(`${originale.nome}: rimesso in magazzino`);
    } else {
      toast.error(esito.errore);
    }
  }

  async function conferma(prodotto: ProdottoMagazzino, scarico: ScaricoConfermato) {
    setFoglio(null);
    const usata = scarico.quantita ?? prodotto.quantita;
    const rimasta = arrotonda(prodotto.quantita - usata);
    const nuovoStato = rimasta > 0 ? "attivo" : scarico.tipo === "spreco" ? "buttato" : "finito";
    // Aggiorna subito la lista (come se fosse già fatto) e torna indietro se il server rifiuta.
    sostituisci(prodotto.id, { quantita: rimasta, stato: nuovoStato });

    const esito = await azioni.scarica({
      clientUuid: crypto.randomUUID(),
      prodottoId: prodotto.id,
      tipo: scarico.tipo,
      quantita: scarico.quantita,
      motivo: scarico.motivo,
    });
    if (!esito.ok) {
      sostituisci(prodotto.id, { quantita: prodotto.quantita, stato: prodotto.stato });
      toast.error(esito.errore);
      return;
    }
    sostituisci(prodotto.id, { quantita: esito.quantita, stato: esito.stato });

    const quanto = formattaQuantita(usata, prodotto.unita);
    const messaggio =
      scarico.tipo === "spreco"
        ? esito.stato === "buttato"
          ? `${prodotto.nome}: buttato`
          : `Buttati ${quanto} di ${prodotto.nome}`
        : esito.stato === "finito"
          ? `${prodotto.nome}: finito`
          : `Usati ${quanto} di ${prodotto.nome}`;
    toast(messaggio, {
      duration: 6000,
      action: { label: "Annulla", onClick: () => void annulla(esito.movimentoId, prodotto) },
    });
  }

  async function salvaModifica(prodotto: ProdottoMagazzino, dati: DatiModifica): Promise<string | null> {
    const esito = await azioni.modifica(prodotto.id, dati);
    if (!esito.ok) return esito.errore;
    sostituisci(prodotto.id, esito.prodotto);
    toast.success("Modifiche salvate");
    return null;
  }

  return (
    <>
      <BarraFiltri filtri={filtri} onChange={setFiltri} />

      {attivi.length === 0 ? (
        <StatoVuoto
          icona={Boxes}
          titolo="Il magazzino è vuoto"
          descrizione="Scansiona l'etichetta di un prodotto per aggiungerlo: ci vogliono pochi secondi."
          azione={{ href: "/scansiona", etichetta: "Scansiona", icona: ScanLine }}
        />
      ) : visibili.length === 0 ? (
        <StatoVuoto
          icona={SearchX}
          titolo="Nessun prodotto trovato"
          descrizione="Prova a cambiare la ricerca o a togliere qualche filtro."
          azione={undefined}
        />
      ) : (
        <>
          <p className="mb-3 text-base text-muted-foreground" aria-live="polite">
            {visibili.length === 1 ? "1 prodotto" : `${visibili.length} prodotti`} · prima esce ciò che scade prima.
            Scorri una scheda: a destra «Usato», a sinistra «Butta».
          </p>
          <ul className="space-y-3">
            {visibili.map((p) => (
              <CardProdotto
                key={p.id}
                prodotto={p}
                adesso={adesso}
                soglie={soglie}
                onApri={() => setFoglio({ tipo: "azioni", prodotto: p })}
                onUsato={() => setFoglio({ tipo: "usato", prodotto: p })}
                onButta={() => setFoglio({ tipo: "butta", prodotto: p })}
              />
            ))}
          </ul>
        </>
      )}

      {haFiltriAttivi(filtri) && attivi.length > 0 && (
        <Button variant="outline" size="lg" className="mt-4 w-full" onClick={() => setFiltri(FILTRI_VUOTI)}>
          Azzera i filtri
        </Button>
      )}
      {attivi.length > 0 && (
        <Link href="/scansiona" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "mt-2 w-full")}>
          <ScanLine aria-hidden />
          Aggiungi un prodotto
        </Link>
      )}

      <FoglioAzioni
        prodotto={foglio?.tipo === "azioni" ? foglio.prodotto : null}
        adesso={adesso}
        soglie={soglie}
        onChiudi={() => setFoglio(null)}
        onUsato={(p) => setFoglio({ tipo: "usato", prodotto: p })}
        onButta={(p) => setFoglio({ tipo: "butta", prodotto: p })}
        onModifica={(p) => setFoglio({ tipo: "modifica", prodotto: p })}
      />
      <FoglioScarico
        prodotto={foglio?.tipo === "usato" || foglio?.tipo === "butta" ? foglio.prodotto : null}
        tipo={foglio?.tipo === "butta" ? "spreco" : "scarico"}
        onChiudi={() => setFoglio(null)}
        onConferma={(p, s) => void conferma(p, s)}
      />
      <FoglioModifica
        prodotto={foglio?.tipo === "modifica" ? foglio.prodotto : null}
        onChiudi={() => setFoglio(null)}
        onSalva={salvaModifica}
      />
    </>
  );
}
