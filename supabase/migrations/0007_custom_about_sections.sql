-- Sections are now customer-defined (title + rich-text body) instead of fixed General/Mission/Vision.
-- Existing section content is intentionally discarded.
drop table if exists public.about_sections;
drop table if exists public.about_section_types;

create table public.about_sections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.about_sections enable row level security;

create policy "anyone can read about sections" on public.about_sections
  for select to anon, authenticated using (true);

create policy "owner manages own about sections" on public.about_sections
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));

notify pgrst, 'reload schema';
