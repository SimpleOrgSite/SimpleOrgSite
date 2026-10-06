-- Documents (PDF / Word) that site owners attach to blocks such as Resources and Forms to download.
-- Public bucket: visitors download them. Owners write only inside their own folder (<user id>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('block-files', 'block-files', true, 10485760, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do nothing;

create policy "owner uploads own block file" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'block-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner updates own block file" on storage.objects
  for update to authenticated
  using (bucket_id = 'block-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner deletes own block file" on storage.objects
  for delete to authenticated
  using (bucket_id = 'block-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Block images use the existing 'logos' bucket, now uploaded straight from the browser, with a 5 MB cap.
update storage.buckets set file_size_limit = 5242880 where id = 'logos';
