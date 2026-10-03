alter table public.sites
  add column news_enabled boolean not null default false,
  add column news_label text not null default 'News';

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  story text not null default '',
  link text not null default '',
  tags text[] not null default '{}',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.news_items enable row level security;

-- Visitors only ever see stories marked "show"; owners see (and manage) all of theirs.
create policy "anyone can read shown news" on public.news_items
  for select to anon, authenticated using (visible);

create policy "owner manages own news" on public.news_items
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));
