-- A sub page lives in a dropdown under another page in the site's menu instead of being its own menu item.
-- Only one level deep: a parent is always a top-level page. Deleting a parent turns its sub pages into normal pages.
alter table public.pages add column parent_id uuid references public.pages (id) on delete set null;
notify pgrst, 'reload schema';
