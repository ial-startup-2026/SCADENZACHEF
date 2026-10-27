import type { CodiceAllergene } from "@/lib/costanti/allergeni";
import type { CodiceCategoria } from "@/lib/costanti/categorie";
import type { CodicePosizione } from "@/lib/costanti/posizioni";
import type { CodiceUnita } from "@/lib/costanti/unita";

/** I dati che si leggono da un'etichetta. */
export type Campo = "nome" | "data_scadenza" | "lotto" | "allergeni" | "quantita";

export type Lettura = {
  nome: string | null;
  /** `YYYY-MM-DD`. */
  data_scadenza: string | null;
  lotto: string | null;
  allergeni: CodiceAllergene[];
  quantita: number | null;
  unita: CodiceUnita | null;
  /** Quanto è sicura la lettura di ogni campo, da 0 (non visibile) a 1 (chiarissimo). */
  confidenza: Record<Campo, number> & { globale: number };
};

export type MotivoFallimento =
  | "non_configurato" // manca la chiave del servizio di lettura
  | "non_autenticato"
  | "immagine_non_valida"
  | "troppe_richieste" // limite per utente
  | "occupato" // il servizio ha detto di riprovare tra poco
  | "risposta_non_valida" // la risposta non rispettava lo schema, anche al secondo tentativo
  | "rifiutata"
  | "errore";

export type EsitoLettura =
  | { ok: true; lettura: Lettura; origine: "ai" | "prova" }
  | { ok: false; motivo: MotivoFallimento };

/** Cosa dire a chi usa l'app quando la lettura non riesce. */
export const MESSAGGI_FALLIMENTO: Record<MotivoFallimento, string> = {
  non_configurato: "La lettura automatica non è attiva.",
  non_autenticato: "Devi accedere per leggere le etichette.",
  immagine_non_valida: "La foto non è valida o è troppo grande.",
  troppe_richieste: "Hai fatto molte letture di fila: aspetta qualche minuto.",
  occupato: "Il servizio di lettura è occupato.",
  risposta_non_valida: "Non sono riuscito a leggere l'etichetta.",
  rifiutata: "Non sono riuscito a leggere questa foto.",
  errore: "Non sono riuscito a leggere l'etichetta (problema di connessione?).",
};

/** Dati di un prodotto da registrare (la foto viaggia a parte). */
export type DatiNuovoProdotto = {
  clientUuid: string;
  nome: string;
  categoria: CodiceCategoria;
  posizione: CodicePosizione;
  quantita: number;
  unita: CodiceUnita;
  data_scadenza: string;
  lotto: string | null;
  allergeni: CodiceAllergene[];
};

export type EsitoSalvataggio =
  | { ok: true; prodottoId: string; /** Qualcosa è andato storto ma il prodotto è salvato (es. la foto no). */ avviso?: string }
  | { ok: false; errore: string };

/** Quello che la schermata di scansione chiede al "di fuori": la vera app, la vetrina e i test lo implementano a modo loro. */
export type ServiziScansione = {
  /** Riduce e comprime la foto prima dell'invio. */
  comprimi: (file: Blob) => Promise<Blob>;
  leggi: (foto: Blob, segnale?: AbortSignal) => Promise<EsitoLettura>;
  salva: (dati: DatiNuovoProdotto, foto: Blob | null) => Promise<EsitoSalvataggio>;
};
