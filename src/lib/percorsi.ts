/** Percorsi raggiungibili senza essere collegati. */
export const PERCORSI_PUBBLICI = ["/accedi", "/registrati", "/configurazione", "/auth/conferma"];

export function eRotaPubblica(pathname: string): boolean {
  return PERCORSI_PUBBLICI.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Accetta solo percorsi interni all'app (parametro `next` dopo il login): niente URL esterni,
 * niente "//host" né "/\host", che il browser interpreterebbe come un altro sito.
 */
export function percorsoSicuro(next: string | null | undefined, predefinito = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return predefinito;
  }
  return next;
}
