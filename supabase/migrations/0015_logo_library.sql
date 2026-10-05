-- A shared library of logos that every site owner can pick from (insurance plans, credential badges).
-- Managed only from the Supabase dashboard: there are deliberately no insert/update/delete policies,
-- so site owners can read it but never change it.
create table public.logo_library (
  id uuid primary key default gen_random_uuid(),
  category text not null,            -- 'insurance' or 'credentials'
  name text not null,                -- shown in the picker, and used as the logo's alt text
  path text not null,                -- file name inside the 'logo-library' storage bucket
  sort_order int not null default 0, -- lower comes first; ties sort by name
  created_at timestamptz not null default now()
);

alter table public.logo_library enable row level security;

create policy "anyone can read the logo library" on public.logo_library
  for select to anon, authenticated using (true);

-- Public bucket (reads need no policy). No write policies on storage.objects for it either: upload from the dashboard.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logo-library', 'logo-library', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
