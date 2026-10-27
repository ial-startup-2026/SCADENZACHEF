# ScadenzaChef

App web (PWA) per il magazzino di una cucina professionale: **cosa c'è, dove e fino a quando**, per ridurre
disorganizzazione e sprechi. Pensata per usarsi in piedi, con una mano, anche con rete instabile.

> Il nome è provvisorio (si cambia in `src/config/app.ts`). Progetto della startup scolastica IAL.

## Vetrina online

**https://ial-startup-2026.github.io/SCADENZACHEF/**: versione dimostrativa con dati di prova, senza account,
le modifiche non vengono salvate. L'app completa ha bisogno di un server e non può stare su GitHub Pages.

## Cosa fa (stato del lavoro)

| Fase | Contenuto | Stato |
|---|---|---|
| 1 | Setup, design system, navigazione | fatto |
| 2 | Database, sicurezza (RLS), accesso, profili e squadra | fatto (da provare con Supabase vero) |
| 3 | Catalogo con semaforo scadenze, filtri, swipe, soglie | fatto |
| 4 | Scansione dell'etichetta con AI, conferma, inserimento manuale | da fare |
| 5 | Allergeni (icone e avvisi) e lista della spesa | da fare |
| 6 | Offline, notifiche push, riepilogo mattutino | da fare |
| 7 | Report sprechi, test end-to-end, deploy | da fare |

Semaforo: verde OK (oltre 7 giorni) · giallo In scadenza (7–4) · arancione Attenzione (3–1) · rosso Scade oggi ·
grigio scuro Scaduto. Le soglie le sceglie l'Admin. Ordine di default: FEFO (scade prima, esce prima).

## Provarla sul proprio computer

Servono Node 24 e npm.

```bash
npm install
npm run dev:demo    # apre l'app senza login e senza database, con dati di prova (http://localhost:3000)
```

Altri comandi: `npm run dev` (app vera, serve Supabase), `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`, `npm run build:vetrina` (versione statica per GitHub Pages).

## Per sviluppatori

- Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres, Auth, Storage, RLS).
- Collegare Supabase: vedi `supabase/README.md` (migrazioni in `supabase/migrations/`, dati di esempio in `supabase/seed.sql`).
- Le regole del progetto, le decisioni e le convenzioni sono in `CLAUDE.md`.
- Le chiavi non vanno mai nel codice: si usa `.env.local` (non versionato); i nomi delle variabili sono in `.env.example`.

> `supabase/seed.sql` crea utenti demo con una password nota: va usato solo per sviluppo e demo, mai su dati veri.
