-- ScadenzaChef — dati di esempio per provare l'app senza scansionare nulla.
--
-- ⚠ SOLO PER SVILUPPO E DEMO. Crea due utenti con una password nota (vedi README):
--   chef@demo.scadenzachef.test   (Admin)      staff@demo.scadenzachef.test   (Staff)
--   password: Demo-Cucina-2026        codice d'invito del locale demo: TRATT2
-- Non eseguirlo su un database con dati veri.
--
-- Le date sono relative a oggi (fuso Europe/Rome): ogni volta che lo esegui ci sono prodotti in
-- tutti gli stati del semaforo. È rieseguibile: cancella e ricrea solo il locale demo.
--
-- Uso: SQL Editor di Supabase (incolla ed esegui) oppure `supabase db reset` in locale.

do $$
declare
  v_oggi constant date := (now() at time zone 'Europe/Rome')::date;
  v_locale constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_admin constant uuid := '11111111-1111-4111-8111-111111111111';
  v_staff constant uuid := '22222222-2222-4222-8222-222222222222';
begin
  -- pulizia del demo precedente
  delete from public.locali where id = v_locale;
  delete from auth.users where id in (v_admin, v_staff);

  -- utenti (stessa forma di quelli creati da Supabase Auth con email e password)
  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     confirmation_token, recovery_token, email_change, email_change_token_new)
  select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
         crypt('Demo-Cucina-2026', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  from (values (v_admin, 'chef@demo.scadenzachef.test'),
               (v_staff, 'staff@demo.scadenzachef.test')) as u(id, email);

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
  from (values (v_admin, 'chef@demo.scadenzachef.test'),
               (v_staff, 'staff@demo.scadenzachef.test')) as u(id, email);

  -- locale, impostazioni, profili
  insert into public.locali (id, nome, codice_invito) values (v_locale, 'Trattoria Demo', 'TRATT2');
  insert into public.impostazioni_locale (locale_id) values (v_locale);
  insert into public.profili (id, locale_id, nome, ruolo_cucina, ruolo) values
    (v_admin, v_locale, 'Marta Rossi', 'Chef', 'admin'),
    (v_staff, v_locale, 'Luca Bianchi', 'Capo partita', 'staff');

  -- prodotti attivi: (nome, categoria, posizione, quantità, unità, giorni a scadenza, lotto, allergeni)
  insert into public.prodotti_magazzino
    (locale_id, nome, categoria, posizione, quantita, unita, data_scadenza, lotto, allergeni, creato_da, creato_il)
  select v_locale, p.nome, p.categoria, p.posizione, p.quantita, p.unita, v_oggi + p.giorni, p.lotto,
         p.allergeni, case when p.n % 2 = 0 then v_admin else v_staff end,
         now() - (p.n || ' hours')::interval
  from (values
    -- Scaduto
    ( 1, 'Panna fresca',               'latticini',  'cella_frigo',    2,    'l',    -3, 'L2610A', '{latte}'::text[]),
    ( 2, 'Gamberi sgusciati',          'pesce',      'cella_frigo',    1.5,  'kg',   -1, 'L2611B', '{crostacei}'),
    -- Scade oggi
    ( 3, 'Mozzarella di bufala',       'latticini',  'cella_frigo',    4,    'pz',    0, 'L2612C', '{latte}'),
    ( 4, 'Petto di pollo',             'carne',      'cella_frigo',    3,    'kg',    0, 'L2609D', '{}'),
    -- Attenzione (1–3 giorni)
    ( 5, 'Burrata',                    'latticini',  'cella_frigo',    6,    'pz',    1, 'L2612E', '{latte}'),
    ( 6, 'Salmone affumicato',         'pesce',      'cella_frigo',    1,    'kg',    2, 'L2610F', '{pesce}'),
    ( 7, 'Uova fresche',               'latticini',  'cella_frigo',    60,   'pz',    3, 'L2611G', '{uova}'),
    ( 8, 'Pane per tartine',           'secco',      'banco',          20,   'pz',    2, null,     '{glutine,sesamo}'),
    -- In scadenza (4–7 giorni)
    ( 9, 'Basilico fresco',            'ortofrutta', 'cella_frigo',    10,   'conf',  4, null,     '{}'),
    (10, 'Prosciutto cotto',           'carne',      'cella_frigo',    2.5,  'kg',    5, 'L2608H', '{}'),
    (11, 'Ricotta',                    'latticini',  'cella_frigo',    3,    'kg',    6, 'L2612I', '{latte}'),
    (12, 'Salsa al pesto',             'salse',      'cella_frigo',    2,    'pz',    7, 'L2607J', '{frutta_a_guscio,latte}'),
    -- OK (oltre 7 giorni)
    (13, 'Pasta fresca all''uovo',     'secco',      'cella_frigo',    5,    'kg',    9, 'L2612K', '{glutine,uova}'),
    (14, 'Parmigiano Reggiano 24 mesi','latticini',  'cella_frigo',    8,    'kg',   45, 'L2605L', '{latte}'),
    (15, 'Farina 00',                  'secco',      'dispensa_secca', 25,   'kg',  120, 'L2606M', '{glutine}'),
    (16, 'Passata di pomodoro',        'salse',      'dispensa_secca', 24,   'pz',  300, 'L2601N', '{}'),
    (17, 'Olio extravergine',          'salse',      'dispensa_secca', 10,   'l',   400, 'L2603O', '{}'),
    (18, 'Gelato alla nocciola',       'surgelati',  'freezer',        5,    'kg',   90, 'L2610P', '{latte,frutta_a_guscio}'),
    (19, 'Spinaci surgelati',          'surgelati',  'freezer',        10,   'kg',  200, 'L2604Q', '{}'),
    (20, 'Branzino interi',            'pesce',      'cella_negativa', 6,    'kg',   60, 'L2611R', '{pesce}'),
    (21, 'Gamberi surgelati',          'surgelati',  'cella_negativa', 5,    'kg',  150, 'L2608S', '{crostacei}'),
    (22, 'Salsa di soia',              'salse',      'banco',          2,    'l',   365, 'L2602T', '{soia,glutine}'),
    (23, 'Vino bianco da cucina',      'bevande',    'dispensa_secca', 12,   'l',   500, 'L2601U', '{solfiti}'),
    (24, 'Tonno in scatola',           'pesce',      'dispensa_secca', 12,   'pz',  700, 'L2512V', '{pesce}')
  ) as p(n, nome, categoria, posizione, quantita, unita, giorni, lotto, allergeni);

  -- ogni prodotto attivo ha il suo carico
  insert into public.movimenti
    (locale_id, prodotto_id, nome_prodotto, categoria, unita, tipo, quantita, utente_id, creato_il)
  select locale_id, id, nome, categoria, unita, 'carico', quantita, creato_da, creato_il
  from public.prodotti_magazzino where locale_id = v_locale;

  -- sprechi degli ultimi giorni (alcuni oltre i 30 giorni, per provare la finestra del report)
  create temp table seed_sprechi (giorni_fa int, nome text, categoria text, unita text,
                                  quantita numeric, motivo text, utente uuid) on commit drop;
  insert into seed_sprechi values
    ( 1, 'Insalata mista', 'ortofrutta', 'kg', 1.2, 'rovinato', v_staff),
    ( 2, 'Panna fresca',   'latticini',  'l',  2,   'scaduto',  v_admin),
    ( 3, 'Salmone fresco', 'pesce',      'kg', 0.8, 'scaduto',  v_staff),
    ( 4, 'Sugo pronto',    'salse',      'l',  3,   'avanzo',   v_staff),
    ( 6, 'Fragole',        'ortofrutta', 'kg', 2,   'rovinato', v_admin),
    ( 8, 'Burrata',        'latticini',  'pz', 5,   'scaduto',  v_staff),
    ( 9, 'Risotto cotto',  'altro',      'kg', 2.5, 'errore',   v_staff),
    (11, 'Carne macinata', 'carne',      'kg', 1.5, 'scaduto',  v_admin),
    (13, 'Zucchine',       'ortofrutta', 'kg', 3,   'rovinato', v_staff),
    (15, 'Yogurt',         'latticini',  'kg', 2,   'scaduto',  v_staff),
    (17, 'Branzino',       'pesce',      'kg', 2,   'scaduto',  v_admin),
    (20, 'Pane',           'secco',      'kg', 1.5, 'avanzo',   v_staff),
    (22, 'Mozzarella',     'latticini',  'kg', 1,   'scaduto',  v_admin),
    (25, 'Pomodori',       'ortofrutta', 'kg', 4,   'rovinato', v_staff),
    (27, 'Besciamella',    'salse',      'l',  2,   'errore',   v_admin),
    (35, 'Gamberi',        'pesce',      'kg', 1,   'scaduto',  v_staff);

  alter table seed_sprechi add column pid uuid default gen_random_uuid();

  insert into public.prodotti_magazzino
    (id, locale_id, nome, categoria, posizione, quantita, unita, data_scadenza, stato, creato_da, creato_il)
  select pid, v_locale, nome, categoria, 'cella_frigo', 0, unita, v_oggi - giorni_fa, 'buttato', utente,
         now() - ((giorni_fa + 5) || ' days')::interval
  from seed_sprechi;

  insert into public.movimenti
    (locale_id, prodotto_id, nome_prodotto, categoria, unita, tipo, quantita, utente_id, creato_il)
  select v_locale, pid, nome, categoria, unita, 'carico', quantita, utente,
         now() - ((giorni_fa + 5) || ' days')::interval
  from seed_sprechi;

  insert into public.movimenti
    (locale_id, prodotto_id, nome_prodotto, categoria, unita, tipo, quantita, motivo, utente_id, creato_il)
  select v_locale, pid, nome, categoria, unita, 'spreco', quantita, motivo, utente,
         now() - (giorni_fa || ' days')::interval
  from seed_sprechi;

  -- lista della spesa
  insert into public.lista_spesa (locale_id, nome, quantita, unita, urgenza, stato, richiesto_da, aggiornato_da, creato_il)
  values
    (v_locale, 'Olio extravergine', 10,   'l',  'bloccante', 'da_comprare', v_staff, v_staff, now() - interval '3 hours'),
    (v_locale, 'Burro',             5,    'kg', 'urgente',   'da_comprare', v_staff, v_staff, now() - interval '5 hours'),
    (v_locale, 'Limoni',            10,   'pz', 'normale',   'da_comprare', v_admin, v_admin, now() - interval '1 day'),
    (v_locale, 'Farina 00',         25,   'kg', 'normale',   'ordinato',    v_admin, v_admin, now() - interval '2 days'),
    (v_locale, 'Rosmarino',         null, null, 'normale',   'acquistato',  v_staff, v_admin, now() - interval '2 days');
end $$;
