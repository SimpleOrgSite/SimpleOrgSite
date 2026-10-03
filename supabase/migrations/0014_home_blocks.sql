-- Home page blocks: stackable, orderable sections whose settings live in a jsonb config.
-- The set of types and their fields is defined in lib/blocks.ts, so a new type needs no migration.
create table public.home_blocks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  type text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.home_blocks enable row level security;

-- Visitors only see blocks that are turned on; owners see and manage all of theirs.
create policy "anyone can read enabled blocks" on public.home_blocks
  for select to anon, authenticated using (enabled);

create policy "owner manages own blocks" on public.home_blocks
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));
