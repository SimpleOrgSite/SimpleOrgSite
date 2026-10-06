-- An inactive page is switched off: not in the menu and its address shows "not found", but it keeps its blocks
-- so the owner can edit it and turn it back on. The home page is always active.
alter table public.pages add column active boolean not null default true;
notify pgrst, 'reload schema';
