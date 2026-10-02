alter table public.sites
  add column directors_layout text not null default 'modal'
    check (directors_layout in ('list', 'modal', 'side', 'cards')),
  add column directors_photo_shape text not null default 'circle'
    check (directors_photo_shape in ('rectangle', 'rounded', 'oval', 'circle'));
