import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Site = {
  id: string;
  site_name: string;
  logo_path: string | null;
  message: string;
  about_enabled: boolean;
  about_content: string;
};

export const getSite = cache(async (domain: string): Promise<Site | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, site_name, logo_path, message, about_enabled, about_content")
    .eq("domain", decodeURIComponent(domain).toLowerCase())
    .maybeSingle();
  return data;
});

export async function logoUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}
