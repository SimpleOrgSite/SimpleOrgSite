// Safe to import from client components (no server code).
export type SitePage = {
  id: string;
  slug: string;
  title: string;
  is_home: boolean;
  show_in_menu: boolean;
  sort_order: number;
  active: boolean;
  parent_id: string | null;
};

// Home first, then each top-level page followed by its sub pages: the order of the menu, the tabs and the list.
// A sub page whose parent no longer exists counts as a top-level page.
export function orderPages<T extends Pick<SitePage, "id" | "is_home" | "sort_order" | "parent_id">>(pages: T[]): T[] {
  const bySort = (a: T, b: T) => a.sort_order - b.sort_order;
  const ids = new Set(pages.map((p) => p.id));
  const isChild = (p: T) => !p.is_home && !!p.parent_id && ids.has(p.parent_id);
  const top = pages.filter((p) => !isChild(p)).sort((a, b) => Number(b.is_home) - Number(a.is_home) || bySort(a, b));
  return top.flatMap((p) => [p, ...pages.filter((c) => isChild(c) && c.parent_id === p.id).sort(bySort)]);
}
