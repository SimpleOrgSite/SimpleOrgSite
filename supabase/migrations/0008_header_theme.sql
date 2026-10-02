alter table public.sites
  add column header_style text not null default 'light' check (header_style in ('light', 'dark')),
  add column theme_color text not null default '#1f2937' check (theme_color ~ '^#[0-9a-fA-F]{6}$');
