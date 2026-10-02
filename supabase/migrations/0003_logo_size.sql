alter table public.sites
  add column logo_size smallint not null default 3 check (logo_size between 1 and 10);
