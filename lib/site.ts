import { cache } from "react";
import type { Director, DirectorLayout, FieldLabels, PhotoShape } from "@/lib/directors";
import { createClient } from "@/lib/supabase/server";

export type Site = {
  id: string;
  site_name: string;
  logo_path: string | null;
  logo_size: number;
  message: string;
  about_enabled: boolean;
  about_label: string;
  directors_enabled: boolean;
  directors_label: string;
  directors_field_labels: Partial<FieldLabels>;
  directors_layout: DirectorLayout;
  directors_photo_shape: PhotoShape;
};

export const getSite = cache(async (domain: string): Promise<Site | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, site_name, logo_path, logo_size, message, about_enabled, about_label, directors_enabled, directors_label, directors_field_labels, directors_layout, directors_photo_shape")
    .eq("domain", decodeURIComponent(domain).toLowerCase())
    .maybeSingle();
  return data;
});

export async function logoUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

export type AboutSectionType = { key: string; label: string; content: string };

// Every section type, with the site's text ("" when unfilled), in display order.
export async function getAboutSections(siteId: string): Promise<AboutSectionType[]> {
  const supabase = await createClient();
  const [{ data: types }, { data: rows }] = await Promise.all([
    supabase.from("about_section_types").select("key, label").order("sort_order"),
    supabase.from("about_sections").select("type_key, content").eq("site_id", siteId),
  ]);
  const content = new Map((rows ?? []).map((r) => [r.type_key, r.content]));
  return (types ?? []).map((t) => ({ ...t, content: content.get(t.key) ?? "" }));
}

export async function getDirectors(siteId: string): Promise<Director[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("directors")
    .select("id, name, title, affiliation, photo_path, bio, email")
    .eq("site_id", siteId)
    .order("created_at");
  return data ?? [];
}
