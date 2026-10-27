-- ScadenzaChef — Storage (solo Supabase: usa lo schema `storage`).
-- Bucket privati. Percorso: <locale_id>/<nome file>, così le policy isolano i locali.
--   etichette  → foto delle etichette (max 5 MB, solo immagini)
--   avatar     → foto profilo: un solo file per utente, <locale_id>/<utente_id>.jpg (max 1 MB)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('etichette', 'etichette', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatar', 'avatar', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy etichette_select on storage.objects for select to authenticated
  using (bucket_id = 'etichette' and (storage.foldername(name))[1] = public.mio_locale_id()::text);
create policy etichette_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'etichette' and (storage.foldername(name))[1] = public.mio_locale_id()::text);

create policy avatar_select on storage.objects for select to authenticated
  using (bucket_id = 'avatar' and (storage.foldername(name))[1] = public.mio_locale_id()::text);
create policy avatar_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatar'
    and name = public.mio_locale_id()::text || '/' || auth.uid()::text || '.jpg');
create policy avatar_update on storage.objects for update to authenticated
  using (bucket_id = 'avatar'
    and name = public.mio_locale_id()::text || '/' || auth.uid()::text || '.jpg')
  with check (bucket_id = 'avatar'
    and name = public.mio_locale_id()::text || '/' || auth.uid()::text || '.jpg');
