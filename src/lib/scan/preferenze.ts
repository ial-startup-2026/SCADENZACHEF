import { CATEGORIE, type CodiceCategoria } from "@/lib/costanti/categorie";
import { POSIZIONI, type CodicePosizione } from "@/lib/costanti/posizioni";

/** Ultime scelte fatte nella schermata di scansione: si riproporranno al prodotto dopo (meno tocchi). */
export type PreferenzeScan = {
  posizione: CodicePosizione;
  categoria: CodiceCategoria;
  /** Scansione continua: dopo il salvataggio si resta sulla fotocamera. */
  continua: boolean;
};

export const PREFERENZE_DEFAULT: PreferenzeScan = { posizione: "cella_frigo", categoria: "altro", continua: false };

const CHIAVE = "scadenzachef:scansione";

/** Legge le preferenze da testo salvato, scartando valori non validi (dati vecchi o manomessi). */
export function analizzaPreferenze(testo: string | null): PreferenzeScan {
  if (!testo) return PREFERENZE_DEFAULT;
  try {
    const v = JSON.parse(testo) as Partial<Record<keyof PreferenzeScan, unknown>>;
    return {
      posizione: POSIZIONI.some((p) => p.codice === v.posizione) ? (v.posizione as CodicePosizione) : PREFERENZE_DEFAULT.posizione,
      categoria: CATEGORIE.some((c) => c.codice === v.categoria) ? (v.categoria as CodiceCategoria) : PREFERENZE_DEFAULT.categoria,
      continua: v.continua === true,
    };
  } catch {
    return PREFERENZE_DEFAULT;
  }
}

let cache: PreferenzeScan | null = null;
const ascoltatori = new Set<() => void>();

/** Istantanea stabile per `useSyncExternalStore` (stesso oggetto finché non cambia qualcosa). */
export function preferenzeCorrenti(): PreferenzeScan {
  if (cache) return cache;
  try {
    cache = analizzaPreferenze(localStorage.getItem(CHIAVE));
  } catch {
    cache = PREFERENZE_DEFAULT;
  }
  return cache;
}

export const preferenzeServer = (): PreferenzeScan => PREFERENZE_DEFAULT;

export function iscriviPreferenze(fn: () => void) {
  ascoltatori.add(fn);
  return () => {
    ascoltatori.delete(fn);
  };
}

export function salvaPreferenze(parziale: Partial<PreferenzeScan>) {
  cache = { ...preferenzeCorrenti(), ...parziale };
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(cache));
  } catch {
    // Archivio non disponibile (navigazione privata): le preferenze valgono solo per questa sessione.
  }
  ascoltatori.forEach((fn) => fn());
}
