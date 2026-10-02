-- Directors section: renameable, with renameable field labels.
alter table public.sites
  add column directors_enabled boolean not null default false,
  add column directors_label text not null default 'Directors',
  add column directors_field_labels jsonb not null default
    '{"name":"Name","title":"Title","affiliation":"Affiliation","photo":"Photo","bio":"Bio","email":"Email"}';

create table public.directors (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  title text not null default '',
  affiliation text not null default '',
  photo_path text,
  bio text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.directors enable row level security;

create policy "anyone can read directors" on public.directors
  for select to anon, authenticated using (true);

create policy "owner manages own directors" on public.directors
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));
