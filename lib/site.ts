import { cache } from "react";
import { blockAnchors, configText, type LibraryLogo, type PageBlock } from "@/lib/blocks";
import type { NewsItem } from "@/lib/news";
import { orderPages, type SitePage } from "@/lib/pages";
import { createClient } from "@/lib/supabase/server";

export type Site = {
  id: string;
  site_name: string;
  logo_path: string | null;
  logo_size: number;
  show_name_with_logo: boolean;
  header_style: "light" | "dark";
  theme_color: string;
  footer_match_header: boolean;
  footer_style: "light" | "dark";
  footer_show_logo: boolean;
  footer_show_name: boolean;
  footer_show_copyright: boolean;
  footer_show_nav: boolean;
  footer_show_email: boolean;
  footer_email: string;
};

export const getSite = cache(async (domain: string): Promise<Site | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, site_name, logo_path, logo_size, show_name_with_logo, header_style, theme_color, footer_match_header, footer_style, footer_show_logo, footer_show_name, footer_show_copyright, footer_show_nav, footer_show_email, footer_email")
    .eq("domain", decodeURIComponent(domain).toLowerCase())
    .maybeSingle();
  return data;
});

export async function logoUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

// Uploaded block documents (PDF / Word) live in their own public bucket.
export async function fileUrl(path: string) {
  const supabase = await createClient();
  return supabase.storage.from("block-files").getPublicUrl(path).data.publicUrl;
}

// Public view: only stories marked "show", in the owner's order.
export const getNews = cache(async (siteId: string): Promise<NewsItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_items")
    .select("id, name, story, link, tags, visible, published_on")
    .eq("site_id", siteId)
    .eq("visible", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export type { SitePage };

// Every page that is switched on, Home first and then in the owner's order. Inactive pages don't exist as far as
// visitors, the menu and link pickers are concerned. ("*" and the filter in code, rather than a column list and a
// query filter, so the site keeps working in the moment between deploying and adding the "active" column.)
export const getPages = cache(async (siteId: string): Promise<SitePage[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").eq("site_id", siteId).order("sort_order").order("created_at");
  return orderPages(
    (data ?? [])
      .filter((p) => p.active !== false)
      .map((p) => ({ id: p.id, slug: p.slug, title: p.title, is_home: p.is_home, show_in_menu: p.show_in_menu, sort_order: p.sort_order, active: true, parent_id: p.parent_id ?? null })),
  );
});

// Public view: only blocks that are turned on, top to bottom.
export const getPageBlocks = cache(async (pageId: string): Promise<PageBlock[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_blocks")
    .select("id, type, enabled, config")
    .eq("page_id", pageId)
    .eq("enabled", true)
    .order("sort_order")
    .order("created_at");
  return data ?? [];
});

// Announcement bars sit above the header, so they belong to the whole site, wherever the owner added them.
export const getAnnouncements = cache(async (siteId: string): Promise<PageBlock[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_blocks")
    .select("id, type, enabled, config")
    .eq("site_id", siteId)
    .eq("type", "announcement")
    .eq("enabled", true)
    .order("created_at");
  return data ?? [];
});

// The whole shared logo library (a small, hand-managed table), with public URLs.
export const getLibraryLogos = cache(async (): Promise<LibraryLogo[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("logo_library").select("id, category, name, path").order("sort_order").order("name");
  return (data ?? []).map(({ path, ...row }) => ({ ...row, url: supabase.storage.from("logo-library").getPublicUrl(path).data.publicUrl }));
});

export type PageLink = { href: string; label: string };

// Every internal destination a button can point to: each page, plus each block on it that the owner has named
// (those become scroll-to anchors). New kinds of destination just add entries here.
export async function sitePageLinks(siteId: string): Promise<PageLink[]> {
  const supabase = await createClient();
  const pages = await getPages(siteId);
  const { data } = await supabase.from("page_blocks").select("id, page_id, config").eq("site_id", siteId).order("sort_order").order("created_at");
  const links: PageLink[] = [];
  for (const page of pages) {
    const base = page.is_home ? "/" : `/${page.slug}`;
    const parent = pages.find((p) => p.id === page.parent_id);
    const name = parent ? `${parent.title} › ${page.title}` : page.title;
    links.push({ href: base, label: name });
    const blocks = (data ?? []).filter((b) => b.page_id === page.id);
    const anchors = blockAnchors(blocks);
    for (const b of blocks) if (anchors[b.id]) links.push({ href: `${base}#${anchors[b.id]}`, label: `${name} › ${configText(b.config, "internal_name")}` });
  }
  return links;
}
