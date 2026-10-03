alter table public.news_items add column published_on date;

alter table public.sites drop constraint if exists sites_news_layout_check;
alter table public.sites add constraint sites_news_layout_check
  check (news_layout in ('full', 'compact', 'list', 'featured', 'timeline'));
