import { aggiungiGiorni, dataOggi } from "@/lib/scadenze/stato-scadenza";
import type { EsitoLettura, Lettura } from "./tipi";

const conf = (nome: number, data: number, lotto: number, allergeni: number, quantita: number, globale: number) => ({
  nome,
  data_scadenza: data,
  lotto,
  allergeni,
  quantita,
  globale,
});

/**
 * Letture di prova (nessun servizio, nessuna chiave): servono a vedere e provare la schermata di
 * conferma. Cambiano a rotazione e includono i casi difficili — data poco sicura, allergeni dubbi,
 * lettura fallita — così si vede come si comporta l'app quando l'etichetta non è chiara.
 * Le date sono relative a oggi.
 */
export function lettureDiProva(adesso: Date): (Lettura | null)[] {
  const oggi = dataOggi(adesso);
  return [
    {
      nome: "Mozzarella di bufala campana DOP",
      data_scadenza: aggiungiGiorni(oggi, 6),
      lotto: "L2611B",
      allergeni: ["latte"],
      quantita: 125,
      unita: "g",
      confidenza: conf(0.97, 0.95, 0.9, 0.92, 0.95, 0.94),
    },
    {
      nome: "Passata di pomodoro",
      data_scadenza: aggiungiGiorni(oggi, 420),
      lotto: "L2601N",
      allergeni: [],
      quantita: 700,
      unita: "g",
      confidenza: conf(0.96, 0.9, 0.85, 0.9, 0.95, 0.92),
    },
    {
      // Data sfocata: va segnalata come "da controllare"
      nome: "Salmone affumicato",
      data_scadenza: aggiungiGiorni(oggi, 9),
      lotto: null,
      allergeni: ["pesce"],
      quantita: 200,
      unita: "g",
      confidenza: conf(0.93, 0.42, 0, 0.9, 0.9, 0.7),
    },
    {
      nome: "Pasta fresca all'uovo",
      data_scadenza: aggiungiGiorni(oggi, 12),
      lotto: "L2612K",
      allergeni: ["glutine", "uova"],
      quantita: 500,
      unita: "g",
      confidenza: conf(0.95, 0.93, 0.88, 0.94, 0.95, 0.93),
    },
    null, // lettura fallita: si passa all'inserimento a mano
    {
      // Ingredienti letti male: gli allergeni vanno ricontrollati
      nome: "Salsa al pesto",
      data_scadenza: aggiungiGiorni(oggi, 30),
      lotto: "L2607J",
      allergeni: ["frutta_a_guscio", "latte"],
      quantita: 190,
      unita: "g",
      confidenza: conf(0.9, 0.88, 0.8, 0.45, 0.9, 0.6),
    },
  ];
}

let contatore = 0;

/** Prossima lettura di prova, a rotazione. */
export function prossimaLetturaDiProva(adesso: Date): EsitoLettura {
  const elenco = lettureDiProva(adesso);
  const lettura = elenco[contatore++ % elenco.length];
  return lettura ? { ok: true, lettura, origine: "prova" } : { ok: false, motivo: "risposta_non_valida" };
}
