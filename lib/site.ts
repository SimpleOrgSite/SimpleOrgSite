import { cache } from "react";
import type { NewsItem, NewsLayout } from "@/lib/news";
import type { Director, DirectorLayout, PhotoShape } from "@/lib/directors";
import { hasText } from "@/lib/richtext";
import { createClient } from "@/lib/supabase/server";

export type Site = {
  id: string;
  site_name: string;
  logo_path: string | null;
  logo_size: number;
  show_name_with_logo: boolean;
  header_style: "light" | "dark";
  theme_color: string;
  news_enabled: boolean;
  news_label: string;
  news_layout: NewsLayout;
  footer_match_header: boolean;
  footer_style: "light" | "dark";
  footer_show_logo: boolean;
  footer_show_name: boolean;
  footer_show_copyright: boolean;
  footer_show_nav: boolean;
  footer_show_email: boolean;
  footer_email: string;
  message: string;
  about_enabled: boolean;
  about_label: string;
  directors_enabled: boolean;
  directors_label: string;
  directors_layout: DirectorLayout;
  directors_photo_shape: PhotoShape;
};

export const getSite = cache(async (domain: string): Promise<Site | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, site_name, logo_path, logo_size, show_name_with_logo, header_style, theme_color, news_enabled, news_label, news_layout, footer_match_header, footer_style, footer_show_logo, footer_show_name, footer_show_copyright, footer_show_nav, footer_show_email, footer_email, message, about_enabled, about_label, directors_enabled, directors_label, directors_layout, directors_photo_shape")
    .eq("domain", decodeURIComponent(domain).toLowerCase())
    .maybeSingle();
  return data;
});

export async function logoUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

export type AboutSection = { id: string; title: string; body: string; anchor: string };

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";

// All of a site's custom sections in order, each with a unique URL anchor derived from its title.
export const getAboutSections = cache(async (siteId: string): Promise<AboutSection[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("about_sections")
    .select("id, title, body")
    .eq("site_id", siteId)
    .order("sort_order")
    .order("created_at");
  const used = new Set(["directors"]); // reserved for the built-in Directors section
  return (data ?? []).map((row) => {
    const base = slugify(row.title);
    let anchor = base;
    for (let n = 2; used.has(anchor); n++) anchor = `${base}-${n}`;
    used.add(anchor);
    return { ...row, anchor };
  });
});

// A section only shows on the public site when it has both a name and some text.
export const isVisible = (s: AboutSection) => !!s.title.trim() && hasText(s.body);

export const getDirectors = cache(async (siteId: string): Promise<Director[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("directors")
    .select("id, name, title, affiliation, photo_path, bio, email")
    .eq("site_id", siteId)
    .order("created_at");
  return data ?? [];
});

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
