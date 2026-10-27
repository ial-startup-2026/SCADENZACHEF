/**
 * Risultato di una Server Action usata da un modulo: un errore o un messaggio di conferma.
 * `valori` rimanda al modulo quanto era stato scritto (mai le password), perché React svuota
 * i campi dopo ogni invio e perdere ciò che si è digitato è fastidioso.
 */
export type StatoAzione = { errore?: string; ok?: string; valori?: Record<string, string> } | undefined;

export function valoriDa(dati: FormData, campi: string[]): Record<string, string> {
  const valori: Record<string, string> = {};
  for (const campo of campi) {
    const v = dati.get(campo);
    if (typeof v === "string") valori[campo] = v;
  }
  return valori;
}
