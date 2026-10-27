-- ScadenzaChef — sicurezza: privilegi minimi + Row Level Security.
-- Regola base: ogni utente vede e modifica solo i dati del proprio locale.
-- Le scritture che toccano più tabelle (carico, scarico, ingresso nel locale) passano da funzioni
-- SECURITY DEFINER (migrazione successiva), non da INSERT/UPDATE diretti.

-- ───────────────────────── funzioni di appoggio per le policy ─────────────────────────

create function public.mio_locale_id() returns uuid
language sql stable security definer
set search_path = '' as $$
  select locale_id from public.profili where id = auth.uid()
$$;

create function public.sono_admin() returns boolean
language sql stable security definer
set search_path = '' as $$
  select coalesce((select ruolo = 'admin' from public.profili where id = auth.uid()), false)
$$;

revoke all on function public.mio_locale_id(), public.sono_admin() from public, anon;
grant execute on function public.mio_locale_id(), public.sono_admin() to authenticated;
revoke all on function public.genera_codice_invito(), public.imposta_aggiornato_il()
  from public, anon, authenticated;

-- ───────────────────────── trigger: chi ha scritto la riga ─────────────────────────

create function public.lista_spesa_utente() returns trigger
language plpgsql security definer
set search_path = '' as $$
begin
  -- Dal client l'autore è sempre l'utente collegato (non si può falsificare).
  -- Da script/job (nessun utente) i valori restano quelli passati.
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.richiesto_da := auth.uid();
    end if;
    new.aggiornato_da := auth.uid();
  end if;
  return new;
end $$;

create trigger lista_spesa_utente_ins before insert on public.lista_spesa
  for each row execute function public.lista_spesa_utente();
create trigger lista_spesa_utente_upd before update on public.lista_spesa
  for each row execute function public.lista_spesa_utente();
revoke all on function public.lista_spesa_utente() from public, anon, authenticated;

-- ───────────────────────── privilegi sulle tabelle ─────────────────────────

alter table public.locali enable row level security;
alter table public.profili enable row level security;
alter table public.impostazioni_locale enable row level security;
alter table public.prodotti_magazzino enable row level security;
alter table public.movimenti enable row level security;
alter table public.lista_spesa enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifiche_inviate enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- "anon" (non autenticato) non ha accesso a nulla.
-- Il codice d'invito non è leggibile dal client: lo restituisce una funzione riservata agli Admin.
grant select (id, nome, creato_il) on public.locali to authenticated;
grant update (nome) on public.locali to authenticated;

grant select on public.profili to authenticated;
grant update (nome, ruolo_cucina, foto_url) on public.profili to authenticated;

grant select on public.impostazioni_locale to authenticated;
grant update (soglia_giallo, soglia_arancione, orario_riepilogo, promemoria_giorni, riepilogo_attivo)
  on public.impostazioni_locale to authenticated;

-- I prodotti si creano con registra_prodotto() e quantità/stato cambiano con scarica_prodotto().
grant select on public.prodotti_magazzino to authenticated;
grant update (nome, categoria, posizione, unita, data_scadenza, lotto, allergeni, foto_etichetta)
  on public.prodotti_magazzino to authenticated;

-- Registro in sola lettura per i client: si scrive solo tramite funzioni.
grant select on public.movimenti to authenticated;

grant select, delete on public.lista_spesa to authenticated;
grant insert (locale_id, nome, quantita, unita, urgenza, prodotto_id, client_uuid)
  on public.lista_spesa to authenticated;
grant update (nome, quantita, unita, urgenza, stato) on public.lista_spesa to authenticated;

grant select, insert, delete on public.push_subscriptions to authenticated;

-- Edge Function / job: bypassano la RLS ma servono i privilegi di tabella.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;

-- ───────────────────────── policy ─────────────────────────

create policy locali_select on public.locali for select to authenticated
  using (id = public.mio_locale_id());
create policy locali_update on public.locali for update to authenticated
  using (id = public.mio_locale_id() and public.sono_admin())
  with check (id = public.mio_locale_id());

create policy profili_select on public.profili for select to authenticated
  using (locale_id = public.mio_locale_id());
create policy profili_update_proprio on public.profili for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy impostazioni_select on public.impostazioni_locale for select to authenticated
  using (locale_id = public.mio_locale_id());
create policy impostazioni_update on public.impostazioni_locale for update to authenticated
  using (locale_id = public.mio_locale_id() and public.sono_admin())
  with check (locale_id = public.mio_locale_id());

create policy prodotti_select on public.prodotti_magazzino for select to authenticated
  using (locale_id = public.mio_locale_id());
create policy prodotti_update on public.prodotti_magazzino for update to authenticated
  using (locale_id = public.mio_locale_id())
  with check (locale_id = public.mio_locale_id());

create policy movimenti_select on public.movimenti for select to authenticated
  using (locale_id = public.mio_locale_id());

create policy spesa_select on public.lista_spesa for select to authenticated
  using (locale_id = public.mio_locale_id());
create policy spesa_insert on public.lista_spesa for insert to authenticated
  with check (locale_id = public.mio_locale_id());
create policy spesa_update on public.lista_spesa for update to authenticated
  using (locale_id = public.mio_locale_id())
  with check (locale_id = public.mio_locale_id());
create policy spesa_delete on public.lista_spesa for delete to authenticated
  using (locale_id = public.mio_locale_id() and (public.sono_admin() or richiesto_da = auth.uid()));

create policy push_select on public.push_subscriptions for select to authenticated
  using (utente_id = auth.uid());
create policy push_insert on public.push_subscriptions for insert to authenticated
  with check (utente_id = auth.uid() and locale_id = public.mio_locale_id());
create policy push_delete on public.push_subscriptions for delete to authenticated
  using (utente_id = auth.uid());

-- notifiche_inviate: RLS attiva e nessuna policy → inaccessibile ai client (solo service_role).
