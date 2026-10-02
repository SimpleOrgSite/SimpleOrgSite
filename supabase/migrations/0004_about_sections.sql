-- Customer-chosen name for the About menu item / page title.
alter table public.sites add column about_label text not null default 'About Us';

-- Section types live in a table so a new one (e.g. History) is just an inserted row.
create table public.about_section_types (
  key text primary key,
  label text not null,
  sort_order int not null default 0
);
insert into public.about_section_types (key, label, sort_order) values
  ('general', 'General', 1),
  ('mission', 'Mission', 2),
  ('vision', 'Vision', 3);

-- One row per filled-in section; an empty section simply has no row.
create table public.about_sections (
  site_id uuid not null references public.sites (id) on delete cascade,
  type_key text not null references public.about_section_types (key),
  content text not null,
  primary key (site_id, type_key)
);

-- Keep what customers already wrote in the old single box.
insert into public.about_sections (site_id, type_key, content)
select id, 'general', about_content from public.sites where trim(about_content) <> '';
alter table public.sites drop column about_content;

alter table public.about_section_types enable row level security;
alter table public.about_sections enable row level security;

create policy "anyone can read section types" on public.about_section_types
  for select to anon, authenticated using (true);

create policy "anyone can read about sections" on public.about_sections
  for select to anon, authenticated using (true);

create policy "owner manages own about sections" on public.about_sections
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));
