-- ScadenzaChef — funzioni (RPC) chiamabili dal client.
-- Tutte SECURITY DEFINER con search_path vuoto: verificano da sole utente, locale e ruolo.
-- Gli errori sono messaggi brevi (es. 'codice_non_valido') che l'app traduce in italiano.
-- Le funzioni di scrittura sono idempotenti tramite client_uuid: la coda offline può rinviare
-- la stessa azione senza creare doppioni.

-- ───────────────────────── ingresso nel locale ─────────────────────────

create function public.crea_locale(p_nome_locale text, p_nome text, p_ruolo_cucina text default null)
returns uuid
language plpgsql security definer
set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_locale uuid;
begin
  if v_uid is null then raise exception 'non_autenticato'; end if;
  if exists (select 1 from public.profili where id = v_uid) then
    raise exception 'profilo_esistente';
  end if;
  if char_length(btrim(coalesce(p_nome_locale, ''))) = 0 then raise exception 'nome_locale_mancante'; end if;
  if char_length(btrim(coalesce(p_nome, ''))) = 0 then raise exception 'nome_mancante'; end if;

  insert into public.locali (nome) values (btrim(p_nome_locale)) returning id into v_locale;
  insert into public.impostazioni_locale (locale_id) values (v_locale);
  insert into public.profili (id, locale_id, nome, ruolo_cucina, ruolo)
    values (v_uid, v_locale, btrim(p_nome), nullif(btrim(coalesce(p_ruolo_cucina, '')), ''), 'admin');
  return v_locale;
end $$;

create function public.unisciti_al_locale(p_codice text, p_nome text, p_ruolo_cucina text default null)
returns uuid
language plpgsql security definer
set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_locale uuid;
begin
  if v_uid is null then raise exception 'non_autenticato'; end if;
  if exists (select 1 from public.profili where id = v_uid) then
    raise exception 'profilo_esistente';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) = 0 then raise exception 'nome_mancante'; end if;

  select id into v_locale from public.locali
    where codice_invito = upper(btrim(coalesce(p_codice, '')));
  if v_locale is null then raise exception 'codice_non_valido'; end if;

  insert into public.profili (id, locale_id, nome, ruolo_cucina, ruolo)
    values (v_uid, v_locale, btrim(p_nome), nullif(btrim(coalesce(p_ruolo_cucina, '')), ''), 'staff');
  return v_locale;
end $$;

-- ───────────────────────── team (solo Admin) ─────────────────────────

create function public.leggi_codice_invito() returns text
language plpgsql stable security definer
set search_path = '' as $$
declare v_codice text;
begin
  if not public.sono_admin() then raise exception 'non_autorizzato'; end if;
  select codice_invito into v_codice from public.locali where id = public.mio_locale_id();
  return v_codice;
end $$;

create function public.rigenera_codice_invito() returns text
language plpgsql security definer
set search_path = '' as $$
declare v_codice text;
begin
  if not public.sono_admin() then raise exception 'non_autorizzato'; end if;
  update public.locali set codice_invito = public.genera_codice_invito()
    where id = public.mio_locale_id()
    returning codice_invito into v_codice;
  return v_codice;
end $$;

create function public.imposta_ruolo(p_utente uuid, p_ruolo text) returns void
language plpgsql security definer
set search_path = '' as $$
declare
  v_locale uuid := public.mio_locale_id();
  v_attuale text;
begin
  if not public.sono_admin() then raise exception 'non_autorizzato'; end if;
  if p_ruolo not in ('admin', 'staff') then raise exception 'ruolo_non_valido'; end if;

  -- Blocca i profili del locale per evitare che due richieste contemporanee tolgano l'ultimo Admin.
  perform 1 from public.profili where locale_id = v_locale for update;
  select ruolo into v_attuale from public.profili where id = p_utente and locale_id = v_locale;
  if v_attuale is null then raise exception 'utente_non_trovato'; end if;

  if v_attuale = 'admin' and p_ruolo = 'staff'
     and (select count(*) from public.profili where locale_id = v_locale and ruolo = 'admin') <= 1 then
    raise exception 'ultimo_admin';
  end if;
  update public.profili set ruolo = p_ruolo where id = p_utente;
end $$;

create function public.rimuovi_membro(p_utente uuid) returns void
language plpgsql security definer
set search_path = '' as $$
declare
  v_locale uuid := public.mio_locale_id();
  v_ruolo text;
begin
  if not public.sono_admin() then raise exception 'non_autorizzato'; end if;
  perform 1 from public.profili where locale_id = v_locale for update;
  select ruolo into v_ruolo from public.profili where id = p_utente and locale_id = v_locale;
  if v_ruolo is null then raise exception 'utente_non_trovato'; end if;
  if v_ruolo = 'admin'
     and (select count(*) from public.profili where locale_id = v_locale and ruolo = 'admin') <= 1 then
    raise exception 'ultimo_admin';
  end if;
  delete from public.profili where id = p_utente;
end $$;

-- ───────────────────────── magazzino ─────────────────────────

create function public.registra_prodotto(
  p_client_uuid uuid,
  p_nome text,
  p_categoria text,
  p_posizione text,
  p_quantita numeric,
  p_unita text,
  p_data_scadenza date,
  p_lotto text default null,
  p_allergeni text[] default '{}',
  p_foto_etichetta text default null
) returns uuid
language plpgsql security definer
set search_path = '' as $$
declare
  v_locale uuid := public.mio_locale_id();
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_locale is null then raise exception 'nessun_locale'; end if;

  if p_client_uuid is not null then
    select id into v_id from public.prodotti_magazzino
      where client_uuid = p_client_uuid and locale_id = v_locale;
    if found then return v_id; end if;
  end if;

  if p_quantita is null or p_quantita <= 0 then raise exception 'quantita_non_valida'; end if;
  if p_foto_etichetta is not null and p_foto_etichetta not like v_locale::text || '/%' then
    raise exception 'foto_non_valida';
  end if;

  insert into public.prodotti_magazzino
    (locale_id, nome, categoria, posizione, quantita, unita, data_scadenza, lotto, allergeni,
     foto_etichetta, creato_da, client_uuid)
  values
    (v_locale, btrim(p_nome), p_categoria, p_posizione, p_quantita, p_unita, p_data_scadenza,
     nullif(btrim(coalesce(p_lotto, '')), ''), coalesce(p_allergeni, '{}'), p_foto_etichetta, v_uid,
     p_client_uuid)
  returning id into v_id;

  insert into public.movimenti (locale_id, prodotto_id, nome_prodotto, categoria, unita, tipo, quantita, utente_id)
    values (v_locale, v_id, btrim(p_nome), p_categoria, p_unita, 'carico', p_quantita, v_uid);
  return v_id;
end $$;

-- Scarica (usato) o butta (spreco, con motivo) un prodotto. p_quantita nulla = tutto il rimasto.
-- Quando la quantità arriva a zero il prodotto diventa 'finito' (scarico) o 'buttato' (spreco).
create function public.scarica_prodotto(
  p_client_uuid uuid,
  p_prodotto_id uuid,
  p_tipo text,
  p_quantita numeric default null,
  p_motivo text default null
) returns jsonb
language plpgsql security definer
set search_path = '' as $$
declare
  v_locale uuid := public.mio_locale_id();
  v_uid uuid := auth.uid();
  v_prod public.prodotti_magazzino%rowtype;
  v_q numeric;
  v_rimasta numeric;
  v_stato text;
  v_mov uuid;
begin
  if v_locale is null then raise exception 'nessun_locale'; end if;
  if p_tipo not in ('scarico', 'spreco') then raise exception 'tipo_non_valido'; end if;
  if p_tipo = 'spreco' and p_motivo is null then raise exception 'motivo_mancante'; end if;

  select * into v_prod from public.prodotti_magazzino
    where id = p_prodotto_id and locale_id = v_locale for update;
  if not found then raise exception 'prodotto_non_trovato'; end if;

  if p_client_uuid is not null then
    select id into v_mov from public.movimenti where client_uuid = p_client_uuid and locale_id = v_locale;
    if found then
      return jsonb_build_object('movimento_id', v_mov, 'quantita', v_prod.quantita,
                                'stato', v_prod.stato, 'ripetuto', true);
    end if;
  end if;

  if v_prod.stato <> 'attivo' then raise exception 'prodotto_non_attivo'; end if;
  v_q := coalesce(p_quantita, v_prod.quantita);
  if v_q <= 0 or v_q > v_prod.quantita then raise exception 'quantita_non_valida'; end if;

  insert into public.movimenti
    (locale_id, prodotto_id, nome_prodotto, categoria, unita, tipo, quantita, motivo, utente_id, client_uuid)
  values
    (v_locale, v_prod.id, v_prod.nome, v_prod.categoria, v_prod.unita, p_tipo, v_q,
     case when p_tipo = 'spreco' then p_motivo end, v_uid, p_client_uuid)
  returning id into v_mov;

  v_rimasta := v_prod.quantita - v_q;
  v_stato := case when v_rimasta > 0 then 'attivo'
                  when p_tipo = 'spreco' then 'buttato'
                  else 'finito' end;
  update public.prodotti_magazzino set quantita = v_rimasta, stato = v_stato where id = v_prod.id;

  return jsonb_build_object('movimento_id', v_mov, 'quantita', v_rimasta, 'stato', v_stato, 'ripetuto', false);
end $$;

-- "Annulla": il movimento resta nel registro, marcato come annullato (e ignorato dai report),
-- e la quantità torna sul prodotto. Lo può fare chi l'ha registrato o un Admin.
create function public.annulla_movimento(p_movimento_id uuid) returns jsonb
language plpgsql security definer
set search_path = '' as $$
declare
  v_locale uuid := public.mio_locale_id();
  v_uid uuid := auth.uid();
  v_mov public.movimenti%rowtype;
  v_prod public.prodotti_magazzino%rowtype;
begin
  if v_locale is null then raise exception 'nessun_locale'; end if;

  select * into v_mov from public.movimenti where id = p_movimento_id and locale_id = v_locale for update;
  if not found then raise exception 'movimento_non_trovato'; end if;
  if v_mov.tipo = 'carico' then raise exception 'non_annullabile'; end if;
  if v_mov.utente_id is distinct from v_uid and not public.sono_admin() then
    raise exception 'non_autorizzato';
  end if;

  select * into v_prod from public.prodotti_magazzino where id = v_mov.prodotto_id for update;
  if v_mov.annullato_il is not null then
    return jsonb_build_object('quantita', v_prod.quantita, 'stato', v_prod.stato, 'ripetuto', true);
  end if;

  update public.movimenti set annullato_il = now(), annullato_da = v_uid where id = v_mov.id;
  update public.prodotti_magazzino
    set quantita = quantita + v_mov.quantita, stato = 'attivo'
    where id = v_mov.prodotto_id
    returning * into v_prod;

  return jsonb_build_object('quantita', v_prod.quantita, 'stato', v_prod.stato, 'ripetuto', false);
end $$;

-- ───────────────────────── permessi ─────────────────────────

revoke all on function
  public.crea_locale(text, text, text),
  public.unisciti_al_locale(text, text, text),
  public.leggi_codice_invito(),
  public.rigenera_codice_invito(),
  public.imposta_ruolo(uuid, text),
  public.rimuovi_membro(uuid),
  public.registra_prodotto(uuid, text, text, text, numeric, text, date, text, text[], text),
  public.scarica_prodotto(uuid, uuid, text, numeric, text),
  public.annulla_movimento(uuid)
from public, anon;

grant execute on function
  public.crea_locale(text, text, text),
  public.unisciti_al_locale(text, text, text),
  public.leggi_codice_invito(),
  public.rigenera_codice_invito(),
  public.imposta_ruolo(uuid, text),
  public.rimuovi_membro(uuid),
  public.registra_prodotto(uuid, text, text, text, numeric, text, date, text, text[], text),
  public.scarica_prodotto(uuid, uuid, text, numeric, text),
  public.annulla_movimento(uuid)
to authenticated;
