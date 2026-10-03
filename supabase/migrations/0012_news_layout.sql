alter table public.sites
  add column news_layout text not null default 'full' check (news_layout in ('full', 'compact'));
