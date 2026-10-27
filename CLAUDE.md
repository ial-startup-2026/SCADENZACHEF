# ScadenzaChef — guida per Claude

PWA mobile-first per il magazzino di un ristorante: cosa c'è, dove e fino a quando; meno sprechi da scadenza.
Il nome è **provvisorio**: vive solo in `src/config/app.ts` (`APP_NAME`).

@AGENTS.md

## Stato delle fasi
- [x] **Fase 1** — setup, design system, navigazione con schermate vuote
- [ ] Fase 2 — schema dati, migrazioni, RLS, seed, auth e profili
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
```
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

## Design system
- **Token in un solo punto**: `src/app/globals.css` (variabili CSS + `@theme inline`). Colori in esadecimale; `src/lib/design/token.test.ts` verifica contrasto AA (≥ 4.5:1) di tutte le coppie testo/sfondo in chiaro e scuro, e che `COLORI_PWA` coincida con i token.
- Primario verde bosco `#1f5a3f` (scuro: `#6cc49a`). Tema chiaro/scuro/auto: classe `dark` su `<html>`, preferenza in `localStorage` (`src/lib/tema.ts`, script inline anti-flash).
- **Semaforo** (`--stato-*`, `src/lib/costanti/stati-scadenza.ts`, componente `ChipStato`): OK verde >7 gg · In scadenza giallo 7–4 · Attenzione arancione 3–1 · Scade oggi rosso · Scaduto grigio scuro. Sempre colore + icona + testo. **Questi colori non si usano per altro.**
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

## Da fare / aperto
- Fase 2: serve un progetto Supabase gratuito (URL + publishable key + service role in `.env.local`, messi dall'utente).
- Fase 4: serve `ANTHROPIC_API_KEY`. Fase 6: chiavi VAPID.
- Sostituire le icone segnaposto con il logo definitivo.
