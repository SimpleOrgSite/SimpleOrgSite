-- Header branding + the About Us section.
alter table public.sites
  add column site_name text not null default '',
  add column logo_path text,
  add column about_enabled boolean not null default false,
  add column about_content text not null default '';

-- Public bucket: logos are shown on public sites, so reads need no policy.
-- 2 MB cap and image-only are enforced here as well as in the server action.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Customers write only inside their own folder (<user id>/...).
create policy "owner uploads own logo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner updates own logo" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner deletes own logo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
