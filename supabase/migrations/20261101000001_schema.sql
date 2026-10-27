-- ScadenzaChef — schema dati.
-- Le liste di valori (allergeni, posizioni, categorie, motivi, unità) devono coincidere con
-- src/lib/costanti/*.ts: un test (src/lib/db/migrazioni.test.ts) lo verifica.

-- ───────────────────────── funzioni di utilità ─────────────────────────

create function public.imposta_aggiornato_il() returns trigger
language plpgsql as $$
begin
  new.aggiornato_il := now();
  return new;
end $$;

-- Codice d'invito: 6 caratteri senza O/0/I/1/L (si detta a voce e si legge male sulle etichette).
create function public.genera_codice_invito() returns text
language plpgsql volatile
set search_path = '' as $$
declare
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- 31 caratteri
  b bytea;
  codice text;
  i int;
begin
  loop
    b := uuid_send(gen_random_uuid());
    codice := '';
    for i in 0..5 loop
      codice := codice || substr(alfabeto, (get_byte(b, i) % 31) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.locali where codice_invito = codice);
  end loop;
  return codice;
end $$;

-- ───────────────────────── locali e profili ─────────────────────────

create table public.locali (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  codice_invito text not null unique default public.genera_codice_invito(),
  creato_il timestamptz not null default now()
);

create table public.profili (
  id uuid primary key references auth.users (id) on delete cascade,
  locale_id uuid not null references public.locali (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  ruolo_cucina text check (ruolo_cucina is null or char_length(ruolo_cucina) <= 40),
  ruolo text not null default 'staff' check (ruolo in ('admin', 'staff')),
  foto_url text,
  creato_il timestamptz not null default now()
);
create index profili_locale_idx on public.profili (locale_id);

create table public.impostazioni_locale (
  locale_id uuid primary key references public.locali (id) on delete cascade,
  soglia_giallo int not null default 7,
  soglia_arancione int not null default 3,
  orario_riepilogo time not null default '08:00',
  promemoria_giorni int[] not null default '{7,3,1,0}',
  riepilogo_attivo boolean not null default true,
  check (soglia_arancione >= 1 and soglia_giallo > soglia_arancione and soglia_giallo <= 60)
);

-- ───────────────────────── magazzino ─────────────────────────

create table public.prodotti_magazzino (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.locali (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  categoria text not null default 'altro'
    check (categoria in ('carne','pesce','latticini','ortofrutta','secco','surgelati','salse','bevande','altro')),
  posizione text not null
    check (posizione in ('cella_frigo','freezer','dispensa_secca','cella_negativa','banco')),
  quantita numeric(10,3) not null check (quantita >= 0),
  unita text not null default 'pz' check (unita in ('pz','kg','g','l','ml','conf')),
  data_scadenza date not null,
  lotto text check (lotto is null or char_length(lotto) <= 60),
  allergeni text[] not null default '{}'
    check (allergeni <@ array['glutine','crostacei','uova','pesce','arachidi','soia','latte',
                              'frutta_a_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi']::text[]),
  foto_etichetta text,
  stato text not null default 'attivo' check (stato in ('attivo','finito','buttato')),
  creato_da uuid references public.profili (id) on delete set null,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  client_uuid uuid unique
);
-- Catalogo FEFO: solo i prodotti attivi del locale, per scadenza.
create index prodotti_fefo_idx on public.prodotti_magazzino (locale_id, data_scadenza)
  where stato = 'attivo';
create trigger prodotti_aggiornato_il before update on public.prodotti_magazzino
  for each row execute function public.imposta_aggiornato_il();

-- Registro dei movimenti: solo in aggiunta (audit). Nome/categoria/unità sono copiati dal
-- prodotto al momento del movimento, così i report restano corretti qualunque cosa succeda dopo.
create table public.movimenti (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.locali (id) on delete cascade,
  prodotto_id uuid references public.prodotti_magazzino (id),
  nome_prodotto text not null,
  categoria text not null,
  unita text not null,
  tipo text not null check (tipo in ('carico','scarico','spreco')),
  quantita numeric(10,3) not null check (quantita > 0),
  motivo text check (motivo in ('scaduto','rovinato','errore','avanzo','altro')),
  utente_id uuid references public.profili (id) on delete set null,
  creato_il timestamptz not null default now(),
  annullato_il timestamptz,
  annullato_da uuid references public.profili (id) on delete set null,
  client_uuid uuid unique,
  check (tipo <> 'spreco' or motivo is not null)
);
create index movimenti_locale_data_idx on public.movimenti (locale_id, creato_il desc);
create index movimenti_prodotto_idx on public.movimenti (prodotto_id);

-- ───────────────────────── lista della spesa ─────────────────────────

create table public.lista_spesa (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.locali (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  quantita numeric(10,3) check (quantita is null or quantita > 0),
  unita text check (unita is null or unita in ('pz','kg','g','l','ml','conf')),
  urgenza text not null default 'normale' check (urgenza in ('normale','urgente','bloccante')),
  stato text not null default 'da_comprare' check (stato in ('da_comprare','ordinato','acquistato')),
  prodotto_id uuid references public.prodotti_magazzino (id) on delete set null,
  richiesto_da uuid references public.profili (id) on delete set null,
  creato_il timestamptz not null default now(),
  aggiornato_da uuid references public.profili (id) on delete set null,
  aggiornato_il timestamptz not null default now(),
  client_uuid uuid unique
);
create index lista_spesa_locale_idx on public.lista_spesa (locale_id, stato);
create trigger lista_spesa_aggiornato_il before update on public.lista_spesa
  for each row execute function public.imposta_aggiornato_il();

-- ───────────────────────── notifiche ─────────────────────────

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  utente_id uuid not null references public.profili (id) on delete cascade,
  locale_id uuid not null references public.locali (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creato_il timestamptz not null default now()
);
create index push_utente_idx on public.push_subscriptions (utente_id);

-- Promemoria già inviati: evita doppioni. La scrive solo la Edge Function (service role).
create table public.notifiche_inviate (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.locali (id) on delete cascade,
  prodotto_id uuid not null references public.prodotti_magazzino (id) on delete cascade,
  giorni_mancanti int not null,
  inviata_il timestamptz not null default now(),
  unique (prodotto_id, giorni_mancanti)
);
