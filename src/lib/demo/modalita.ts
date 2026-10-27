/**
 * Modalità demo: l'app si apre direttamente sulle schermate vere, senza login e senza database,
 * con dati di prova tenuti in memoria. Serve per vedere e provare l'app prima di collegare Supabase.
 *
 * Si attiva SOLO con `MODALITA_DEMO=1` (vedi `npm run dev:demo`) e MAI in produzione:
 * in produzione il controllo restituisce sempre `false`, qualunque sia la variabile.
 */
export function modalitaDemo(): boolean {
  return process.env.MODALITA_DEMO === "1" && process.env.NODE_ENV !== "production";
}
