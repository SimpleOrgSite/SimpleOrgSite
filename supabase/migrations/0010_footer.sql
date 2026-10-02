alter table public.sites
  add column footer_match_header boolean not null default true,
  add column footer_style text not null default 'light' check (footer_style in ('light', 'dark')),
  add column footer_show_logo boolean not null default false,
  add column footer_show_name boolean not null default true,
  add column footer_show_copyright boolean not null default true,
  add column footer_show_nav boolean not null default false,
  add column footer_show_email boolean not null default false,
  add column footer_email text not null default '';
