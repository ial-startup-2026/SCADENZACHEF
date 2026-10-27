import { useSyncExternalStore } from "react";

let istante: Date | null = null;
const nessunAbbonamento = () => () => {};

/**
 * "Adesso" del browser. Nella vetrina statica le pagine vengono costruite una volta sola: se la data
 * fosse calcolata in fase di build resterebbe quella del giorno della pubblicazione. Sul server
 * restituisce `null` e il contenuto compare appena la pagina è nel browser.
 */
export function useAdessoNelBrowser(): Date | null {
  return useSyncExternalStore(
    nessunAbbonamento,
    () => (istante ??= new Date()),
    () => null,
  );
}
