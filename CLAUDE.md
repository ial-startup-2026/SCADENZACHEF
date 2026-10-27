# ScadenzaChef — guida per Claude

PWA mobile-first per il magazzino di un ristorante: cosa c'è, dove e fino a quando; meno sprechi da scadenza.
Il nome è **provvisorio**: vive solo in `src/config/app.ts` (`APP_NAME`).

@AGENTS.md

## Stato delle fasi
- [x] **Fase 1** — setup, design system, navigazione con schermate vuote
- [x] **Fase 2** — schema dati, migrazioni, RLS, seed, auth e profili (database verificato con PGlite; flussi con login **da provare dal vivo** appena c'è il progetto Supabase)
- [ ] Fase 3 — catalogo con semaforo, filtri, swipe, logica scadenze + test
- [ ] Fase 4 — scansione (cattura, route AI, conferma, fallback, modalità continua)
- [ ] Fase 5 — allergeni e lista della spesa
- [ ] Fase 6 — offline/PWA, push, riepilogo mattutino
- [ ] Fase 7 — report sprechi, rifinitura, E2E Playwright, README

Il piano completo approvato è in `~/.claude/plans/eager-tickling-garden.md`.

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (stile `base-nova`, primitive `@base-ui/react`) · lucide-react · sonner (toast) · Zod · Vitest + Testing Library · npm (non pnpm).
Previsti: Supabase (`@supabase/ssr`), Serwist (service worker), `idb` (coda offline), `motion` (swipe), `@anthropic-ai/sdk`, `web-push`, Playwright.

## Comandi
```bash
npm run dev         # sviluppo (http://localhost:3000)
npm run build       # build di produzione (include il typecheck di Next)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest (una volta)   |  npm run test:watch
npm run format      # Prettier
npm run icone       # rigenera le icone PWA da scripts/genera-icone.mjs
npm run db:sql      # unisce le migrazioni in supabase/.generato/setup.sql (da incollare nello SQL Editor)
```
Setup di Supabase, migrazioni e seed: vedi `supabase/README.md`. Senza `.env.local` compilato l'app mostra `/configurazione`.
Se `typecheck` segnala tipi di `.next/` obsoleti dopo aver spostato/rimosso pagine: `rm -rf .next && npx next typegen`.
A fine di ogni fase: lint + typecheck + test devono passare, poi avvio e verifica dell'app, poi commit.

## Convenzioni
- **Lingua**: UI e microcopy in italiano, diretto, senza gergo. Nomi di dominio (tabelle, tipi, cartelle) in italiano come nello schema; infrastruttura in inglese tecnico.
- **Fuso**: sempre `Europe/Rome` (`TIMEZONE`). Le scadenze sono *date di calendario* (`YYYY-MM-DD`), non istanti: si confrontano giorni, mai millisecondi.
- Percorsi: alias `@/` → `src/`. Costanti di dominio in `src/lib/costanti/`, un file per concetto (allergeni, posizioni, categorie, motivi spreco, stati scadenza).
- Componenti di pagina nelle route; componenti riusabili in `src/components/`; primitive shadcn in `src/components/ui/`.
- `cn()` è in `src/lib/utils.ts` (clsx + tailwind-merge). **Non importare il pacchetto npm `cn`**: il generatore shadcn l'ha agganciato per errore ed è stato sostituito.
- Next 16: `cacheComponents` e `partialPrefetching` **disattivati** in `next.config.ts` (default del template, ma complicano un'app con login e offline). Prima di usare API di Next che non conosci, leggi `node_modules/next/dist/docs/`.
- Nessun segreto nel codice: solo `.env.local` (gitignored); nomi delle variabili in `.env.example`. La chiave Anthropic e la service role di Supabase restano solo lato server.
- Nessuna azione distruttiva senza conferma o "Annulla".

## Dati e sicurezza (Fase 2)
- Migrazioni in `supabase/migrations/` (schema → RLS e privilegi → funzioni → storage). Tabelle: `locali, profili, impostazioni_locale, prodotti_magazzino, movimenti, lista_spesa, push_subscriptions, notifiche_inviate`.
- **Privilegi minimi**: `anon` non accede a nulla; i client scrivono solo le colonne con `GRANT` esplicito. Prodotti e movimenti **non** si scrivono con INSERT/UPDATE diretti sui campi sensibili: si usano le funzioni `registra_prodotto`, `scarica_prodotto` (usato/finito/spreco con motivo), `annulla_movimento`, `crea_locale`, `unisciti_al_locale`, `imposta_ruolo`, `rimuovi_membro`, `rigenera_codice_invito`, `leggi_codice_invito`. Sono idempotenti tramite `client_uuid` (serve alla coda offline della Fase 6).
- `movimenti` è un registro in sola aggiunta (audit: chi e quando). Un "Annulla" marca il movimento (`annullato_il`) e i report devono **ignorare i movimenti annullati**. Nome/categoria/unità sono copiati nel movimento.
- La colonna `locali.codice_invito` non è leggibile con `select`: **elencare sempre le colonne** (mai `select *` su `locali`). Il codice si legge con `leggi_codice_invito()` (solo Admin).
- Gli errori delle funzioni sono codici brevi (`codice_non_valido`, `ultimo_admin`…) tradotti da `src/lib/errori.ts`.
- Le liste di valori (allergeni, posizioni, categorie, motivi, unità) stanno in `src/lib/costanti/` **e** nei CHECK delle migrazioni: un test le confronta, quindi cambiano sempre insieme.
- **Test del database**: `src/lib/db/migrazioni.test.ts` esegue migrazioni + seed su PGlite (Postgres in memoria, nessun Docker) con uno stub di `auth` (`src/lib/db/test-db.ts`). Ogni nuova migrazione va coperta lì (RLS inclusa).
- Auth: email+password, `@supabase/ssr`. `src/proxy.ts` (Next 16: ex middleware) rinnova la sessione e manda al login; **non** è il controllo di sicurezza: quello è la RLS + `richiediProfilo()/richiediAdmin()` (`src/lib/auth.ts`) + verifiche nelle Server Action. Client: `src/lib/supabase/{client,server,sessione}.ts`. Il parametro `next` passa sempre da `percorsoSicuro()`.
- Flusso: registrazione → `/benvenuto` (crea locale = Admin, oppure codice = Staff; link d'invito `/benvenuto?codice=XXXXXX`) → app. Layout `(app)` rimanda a `/benvenuto` chi non ha un locale.
- Moduli: `ModuloAzione` + `Campo` (`useActionState`); le azioni restituiscono `StatoAzione` e rimandano i valori scritti (mai la password) perché React svuota il form.
- Tipi delle righe scritti a mano in `src/lib/supabase/tipi.ts` (nessun `Database` generato finora).

## Design system
- **Token in un solo punto**: `src/app/globals.css` (variabili CSS + `@theme inline`). Colori in esadecimale; `src/lib/design/token.test.ts` verifica contrasto AA (≥ 4.5:1) di tutte le coppie testo/sfondo in chiaro e scuro, e che `COLORI_PWA` coincida con i token.
- Primario verde bosco `#1f5a3f` (scuro: `#6cc49a`). Tema chiaro/scuro/auto: classe `dark` su `<html>`, preferenza in `localStorage` (`src/lib/tema.ts`, script inline anti-flash).
- **Semaforo** (`--stato-*`, `src/lib/costanti/stati-scadenza.ts`, componente `ChipStato`): OK verde >7 gg · In scadenza giallo 7–4 · Attenzione arancione 3–1 · Scade oggi rosso · Scaduto grigio scuro. Sempre colore + icona + testo. **Questi colori non si usano per altro.**
- **Look (rifinitura grafica)**: marchio = disco-orologio con foglia (`src/components/marchio.tsx`; stessa geometria in `scripts/genera-icone.mjs`, rigenera con `npm run icone`). Titoli e nome in **Bricolage Grotesque** (`--font-display-var`, applicato a h1–h3), testo in Geist. Testate a gradiente bosco (`sfondo-hero`, token `--hero-from/--hero-to/--hero-fg`; sul bottone bianco della testata `--hero-cta-*`), superfici morbide `--primary-soft`, ombre `shadow-carta` (`--ombra`), entrata `animazione-entra` (disattivata con *reduce motion*). Pagine fuori dall'app: `PaginaMarchio` (testata + scheda bianca). Home: `RiepilogoSemaforo` — un riquadro si colora **solo se il conteggio è > 0**, a zero resta neutro (il colore del semaforo compare solo quando serve). Voce attiva della tab bar = pillola dietro l'icona + grassetto (non solo colore).
- **Non usare** `text-primary` su fondi bianchi/chiari in tema scuro (il primario scuro-mode è menta chiaro): usare i token `--hero-cta-*` o `foreground`.
- `/design` e `/design/{home,magazzino,spesa,scansiona}`: anteprime senza login, solo in sviluppo (404 in produzione). Chi aggiunge token o coppie testo/sfondo deve aggiungerle anche a `src/lib/design/token.test.ts`.
- Tap target ≥ 48 px (bottoni: `min-h-12`; tab bar 64 px; Scansiona centrale 64 px), testo corpo ≥ 16 px (etichette della tab bar 14 px), azioni principali in basso, angoli 16 px+.
- `/design` mostra token e componenti, solo in sviluppo (404 in produzione).
- Navigazione: tab bar `Home · Magazzino · [Scansiona] · Spesa · Profilo` in `src/components/tab-bar.tsx`. `/scansiona` è a schermo intero, fuori dal gruppo `(app)`. Le funzioni Admin vanno dentro Profilo.

## Decisioni prese
| Fase | Decisione |
|---|---|
| 1 | Progetto in sottocartella `ScadenzaChef/` perché la cartella madre contiene altri lavori. Il pacchetto npm si chiama `scadenzachef` (npm vieta le maiuscole). |
| 1 | npm al posto di pnpm (pnpm non installato). Docker assente → niente Supabase locale: si userà un progetto Supabase cloud. |
| 1 | `@vitejs/plugin-react` non installato (conflitto di peer dependency con babel/shadcn e non serve: Vitest compila il JSX con esbuild). |
| 1 | `@types/node` portato a ^24 (richiesto da Vitest, coerente con Node 24). |
| 1 | Icone PWA PNG generate con `sharp` (già presente tramite Next) da `scripts/genera-icone.mjs`; `public/icons/*` + `src/app/icon.png` + `src/app/apple-icon.png`. Sono segnaposto: da sostituire con il logo vero. |
| 1 | Manifest in `src/app/manifest.ts`; service worker e offline arrivano in Fase 6. |
| 2b | Rifinitura grafica: marchio C (disco + foglia) scelto confrontando 4 varianti a 200/48/32 px; font display Bricolage Grotesque; Home con riepilogo del semaforo (conteggi a zero finché non c'è il catalogo, Fase 3). Il profilo (pagina dopo il login) non è stato ridisegnato. |
| 2 | Verifica del database con PGlite invece di Supabase locale (niente Docker). Limite: lo stub di `auth` non replica GoTrue e la migrazione Storage non è eseguita nei test. |
| 2 | Codice d'invito di 6 caratteri (alfabeto senza O/0/I/1/L), non indovinabile con `select`; nessun rate-limit dedicato oltre a quello di Supabase Auth. |
| 2 | Annullare = marcare il movimento (`annullato_il`) invece di scrivere un movimento inverso, per non sporcare i report sprechi. |
| 2 | I prodotti non si cancellano: cambiano `stato` (`attivo/finito/buttato`). Non esiste (ancora) una rettifica che *aumenta* la quantità: si corregge con "annulla" o registrando un nuovo carico. |
| 2 | Foto profilo: bucket privato `avatar`, ritaglio quadrato 256 px nel browser, link firmati di 1 ora. Foto etichette: bucket privato `etichette`, percorso `<locale_id>/…`. |
| 2 | `seed.sql` crea utenti demo con password nota (solo sviluppo, documentato in `supabase/README.md`). |
| 2 | Conferma email di Supabase: l'app gestisce sia attiva (link → `/auth/conferma`) sia disattiva; in sviluppo conviene disattivarla. |

## Da fare / aperto
- **Fase 2 da chiudere dal vivo**: serve il progetto Supabase gratuito (URL + publishable key in `.env.local`, messi dall'utente), poi applicare le migrazioni + seed e provare: registrazione, creazione/ingresso nel locale, profilo con foto, team (invito, ruoli, rimozione). Non ancora fatto.
- Password dimenticata / cambio password: non ancora implementato.
- Rimozione di un membro: l'account Auth resta (può rientrare con un codice); nessuna cancellazione account.
- Fase 4: serve `ANTHROPIC_API_KEY`. Fase 6: chiavi VAPID.
- Sostituire le icone segnaposto con il logo definitivo.
