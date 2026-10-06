-- Pages: every site has a Home page plus any number of pages the owner adds, each with its own stack of blocks.
-- This replaces the fixed About page and the News page. Existing About and News content is converted into pages below.
-- The old about_sections / directors tables and the about_*, directors_*, news_* columns on sites are left in place
-- (now unused) so nothing is lost; a later migration can drop them once you've checked the converted pages.
begin;

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  slug text not null,                       -- '' for the home page, otherwise the address, e.g. 'about'
  title text not null,                      -- shown in the menu and as the dashboard tab
  is_home boolean not null default false,
  show_in_menu boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);
create unique index pages_one_home_per_site on public.pages (site_id) where is_home;

alter table public.pages enable row level security;

create policy "anyone can read pages" on public.pages
  for select to anon, authenticated using (true);

create policy "owner manages own pages" on public.pages
  for all to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = auth.uid()));

-- Every existing site gets a Home page.
insert into public.pages (site_id, slug, title, is_home, show_in_menu, sort_order)
select id, '', 'Home', true, true, 0 from public.sites;

-- Blocks now belong to a page. All existing blocks move onto their site's Home page.
alter table public.home_blocks rename to page_blocks;
alter table public.page_blocks add column page_id uuid references public.pages (id) on delete cascade;
update public.page_blocks b set page_id = p.id from public.pages p where p.site_id = b.site_id and p.is_home;
alter table public.page_blocks alter column page_id set not null;
create index page_blocks_page_idx on public.page_blocks (page_id, sort_order);

-- About -> a page (same address, /about), only for sites that actually have About content.
insert into public.pages (site_id, slug, title, is_home, show_in_menu, sort_order)
select s.id, 'about', coalesce(nullif(trim(s.about_label), ''), 'About Us'), false, s.about_enabled, 1
from public.sites s
where exists (
        select 1 from public.about_sections a
        where a.site_id = s.id and trim(a.title) <> '' and trim(regexp_replace(a.body, '<[^>]+>|&nbsp;', '', 'g')) <> ''
      )
   or exists (select 1 from public.directors d where d.site_id = s.id);

-- Each filled-in About section becomes a Free text block. Its internal name is the old section title, so the
-- old menu anchors (/about#our-mission) keep working.
insert into public.page_blocks (site_id, page_id, type, enabled, sort_order, config)
select a.site_id, p.id, 'rich_text', true, a.rn,
       jsonb_build_object(
         'internal_name', a.title, 'heading', a.title, 'body', a.body,
         'align', 'left', 'background', case when a.rn % 2 = 1 then 'tint' else 'white' end
       )
from (
  select *, row_number() over (partition by site_id order by sort_order, created_at) as rn
  from public.about_sections
  where trim(title) <> '' and trim(regexp_replace(body, '<[^>]+>|&nbsp;', '', 'g')) <> ''
) a
join public.pages p on p.site_id = a.site_id and p.slug = 'about';

-- Directors -> one Team grid block at the end of the About page.
insert into public.page_blocks (site_id, page_id, type, enabled, sort_order, config)
select d.site_id, p.id, 'team', true, 1000,
       jsonb_build_object(
         'internal_name', coalesce(nullif(trim(s.directors_label), ''), 'Directors'),
         'heading', coalesce(nullif(trim(s.directors_label), ''), 'Directors'),
         'subhead', '',
         'shape', s.directors_photo_shape,
         'items', jsonb_agg(
           jsonb_build_object(
             'name', d.name,
             'role', concat_ws(', ', nullif(trim(d.title), ''), nullif(trim(d.affiliation), '')),
             'bio', trim(regexp_replace(regexp_replace(d.bio, '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g')),
             'photo_path', d.photo_path
           ) order by d.created_at
         )
       )
from public.directors d
join public.sites s on s.id = d.site_id
join public.pages p on p.site_id = d.site_id and p.slug = 'about'
group by d.site_id, p.id, s.directors_label, s.directors_photo_shape;

-- News -> a page (/news) holding a News stories block, for sites that had News switched on.
insert into public.pages (site_id, slug, title, is_home, show_in_menu, sort_order)
select id, 'news', coalesce(nullif(trim(news_label), ''), 'News'), false, true, 2
from public.sites where news_enabled;

insert into public.page_blocks (site_id, page_id, type, enabled, sort_order, config)
select s.id, p.id, 'news_list', true, 0,
       jsonb_build_object('internal_name', 'News stories', 'heading', '', 'layout', s.news_layout)
from public.sites s
join public.pages p on p.site_id = s.id and p.slug = 'news'
where s.news_enabled;

notify pgrst, 'reload schema';

commit;
