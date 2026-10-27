/**
 * Limite di richieste per utente in una finestra di tempo (scorrevole). Tiene i conteggi in memoria:
 * basta a frenare un uso scorretto su un solo server; su più istanze serve un archivio condiviso.
 */
export function creaLimitatore(max: number, finestraMs: number, adesso: () => number = Date.now) {
  const richieste = new Map<string, number[]>();

  return {
    /** Registra una richiesta; `false` se `chiave` ha già raggiunto il limite. */
    consuma(chiave: string): boolean {
      const ora = adesso();
      const recenti = (richieste.get(chiave) ?? []).filter((t) => ora - t < finestraMs);
      if (recenti.length >= max) {
        richieste.set(chiave, recenti);
        return false;
      }
      recenti.push(ora);
      richieste.set(chiave, recenti);
      return true;
    },
  };
}
