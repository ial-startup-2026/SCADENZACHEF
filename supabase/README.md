# Database (Supabase)

Schema, sicurezza e funzioni sono in `migrations/` (si applicano in ordine di nome).
`seed.sql` crea un locale demo con dati di esempio.

## Collegare un progetto Supabase (una volta)

1. Crea un progetto gratuito su <https://supabase.com> e scegli la regione UE (es. Frankfurt).
2. **Project settings → API**: copia *Project URL* e *Publishable key* in `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). La *service role key* serve solo
   dalla Fase 6, e non va mai messa in variabili `NEXT_PUBLIC_*`.
3. **Authentication → Sign In / Providers → Email**: per provare l'app disattiva *Confirm email*
   (altrimenti ogni registrazione richiede il clic sul link nell'email).
4. **Authentication → URL Configuration**: *Site URL* `http://localhost:3000` e, tra i *Redirect URLs*,
   `http://localhost:3000/**` (a regime aggiungi anche l'indirizzo pubblicato).

## Applicare le migrazioni

**Più semplice** (nessun programma da installare):

```bash
npm run db:sql
```

poi apri `supabase/.generato/setup.sql`, copia tutto e incollalo nello **SQL Editor** di Supabase → *Run*.

**Con la CLI** (utile quando ci saranno nuove migrazioni):

```bash
npx supabase login
npx supabase link --project-ref <ref-del-progetto>
npx supabase db push
```

## Dati di esempio (solo sviluppo)

Incolla `seed.sql` nello SQL Editor ed esegui. Crea il locale "Trattoria Demo" con due utenti
(`chef@demo.scadenzachef.test` Admin, `staff@demo.scadenzachef.test` Staff, password `Demo-Cucina-2026`)
e ~24 prodotti con scadenze relative a oggi, in tutti gli stati del semaforo. Si può rieseguire.
**Non eseguirlo su un database con dati veri**: crea utenti con password nota.

## Test

`npm test` esegue anche `src/lib/db/migrazioni.test.ts`: applica le migrazioni e il seed su un Postgres in
memoria (PGlite) e verifica RLS, privilegi e funzioni. Non serve Supabase né Docker.
Lo stub dell'ambiente Supabase (`auth.uid()`, ruoli) è in `src/lib/db/test-db.ts`; la migrazione dello
Storage non viene applicata nel test (usa lo schema `storage`, presente solo su Supabase).
