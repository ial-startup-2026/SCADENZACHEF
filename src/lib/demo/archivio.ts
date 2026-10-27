import type { Soglie } from "@/lib/scadenze/soglie";
import { SOGLIE_DEFAULT } from "@/lib/scadenze/soglie";
import type { Locale, Profilo } from "@/lib/supabase/tipi";
import type { Registro } from "./operazioni";
import { prodottiDemo } from "./prodotti";

export const UTENTE_DEMO = { id: "11111111-1111-4111-8111-111111111111", email: "demo@scadenzachef.test" };
export const LOCALE_DEMO: Locale = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", nome: "Trattoria Demo" };

export type ArchivioDemo = Registro & {
  soglie: Soglie;
  membri: Profilo[];
  codiceInvito: string;
};

const crea = (): ArchivioDemo => ({
  prodotti: prodottiDemo(new Date().toISOString()),
  movimenti: new Map(),
  soglie: { ...SOGLIE_DEFAULT },
  codiceInvito: "TRATT2",
  membri: [
    { id: UTENTE_DEMO.id, locale_id: LOCALE_DEMO.id, nome: "Marta Rossi", ruolo_cucina: "Chef", ruolo: "admin", foto_url: null },
    { id: "22222222-2222-4222-8222-222222222222", locale_id: LOCALE_DEMO.id, nome: "Luca Bianchi", ruolo_cucina: "Capo partita", ruolo: "staff", foto_url: null },
  ],
});

// Sopravvive alle ricompilazioni a caldo del server di sviluppo.
const globale = globalThis as typeof globalThis & { __scadenzachefDemo?: ArchivioDemo };

/** Dati di prova condivisi da tutte le richieste finché il server di sviluppo resta acceso. */
export function archivioDemo(): ArchivioDemo {
  return (globale.__scadenzachefDemo ??= crea());
}

/** Il "me stesso" della modalità demo: il primo membro (Admin). */
export const profiloDemo = (): Profilo => archivioDemo().membri[0];
