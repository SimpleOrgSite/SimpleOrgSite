-- One site per customer for the proof of concept (owner_id is unique).
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  domain text not null unique check (domain = lower(domain)),
  message text not null default 'Hello, world!',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;

-- Customers manage only their own site.
create policy "owner manages own site" on public.sites
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- The tenant page is public and looks sites up by domain with the anon key,
-- so no service-role key is needed. Everything in this table is public anyway.
create policy "anyone can read sites" on public.sites
  for select to anon, authenticated
  using (true);
