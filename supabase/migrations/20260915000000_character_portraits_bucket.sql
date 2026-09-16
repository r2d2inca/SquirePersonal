-- The character-portraits storage bucket was created by hand in the original project's
-- dashboard, so it never travelled with the schema. A fresh Supabase project ends up with
-- the portrait_url column but nowhere to put the file, and importing a character that has
-- a portrait fails with "Bucket not found".

insert into storage.buckets (id, name, public)
values ('character-portraits', 'character-portraits', true)
on conflict (id) do nothing;

-- Portraits are served by public URL (storage.getPublicUrl), so reads are open. Writes are
-- confined to each user's own folder, matching the upload path `<user id>/<character id>.<ext>`.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Character portraits are publicly readable'
  ) then
    create policy "Character portraits are publicly readable"
      on storage.objects for select
      using (bucket_id = 'character-portraits');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users manage own character portraits'
  ) then
    create policy "Users manage own character portraits"
      on storage.objects for all to authenticated
      using (
        bucket_id = 'character-portraits'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'character-portraits'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
