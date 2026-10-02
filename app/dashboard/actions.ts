"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_FIELD_LABELS, DIRECTOR_FIELDS, DIRECTOR_LAYOUTS, PHOTO_SHAPES, type FieldLabels } from "@/lib/directors";
import { createClient } from "@/lib/supabase/server";
import { addDomainToVercel, checkDomain, isValidDomain, normalizeDomain, removeDomainFromVercel } from "@/lib/domain";

export type FormState = { error?: string; ok?: string } | null;

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return { supabase, user: data.user };
}

export async function addDomain(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const domain = normalizeDomain(String(formData.get("domain")));
  if (!isValidDomain(domain)) return { error: "That doesn't look like a valid domain (e.g. example.com)." };

  const vercelError = await addDomainToVercel(domain);
  if (vercelError) return { error: vercelError };

  const { error } = await supabase.from("sites").insert({ owner_id: user.id, domain });
  if (error) {
    return { error: error.code === "23505" ? "That domain is already registered." : error.message };
  }
  revalidatePath("/dashboard");
  return null;
}

export async function removeDomain() {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("domain").eq("owner_id", user.id).maybeSingle();
  if (site) await removeDomainFromVercel(site.domain);
  await supabase.from("sites").delete().eq("owner_id", user.id);
  revalidatePath("/dashboard");
}

export async function saveMessage(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const message = String(formData.get("message")).trim();
  if (!message) return { error: "Message can't be empty." };
  const { error } = await supabase.from("sites").update({ message }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  // React resets the form after the action; revalidating makes it reset to the new saved value, not the old one.
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function verifySite(): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id, domain").eq("owner_id", user.id).maybeSingle();
  if (!site) return { error: "No domain set." };

  const { dns, loads } = await checkDomain(site.domain, site.id);
  await supabase.from("sites").update({ verified_at: loads ? new Date().toISOString() : null }).eq("id", site.id);
  revalidatePath("/dashboard");
  if (loads) return { ok: "Your domain is live." };
  if (!dns) return { error: "DNS isn't pointing at us yet. Changes can take a while to propagate; try again shortly." };
  return { error: "DNS is set, but the page didn't load yet. The HTTPS certificate may still be provisioning; try again shortly." };
}

export async function saveSiteName(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const site_name = String(formData.get("site_name")).trim();
  const { error } = await supabase.from("sites").update({ site_name }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function uploadLogo(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "Logo must be a PNG, JPG, WebP or SVG." };
  if (file.size > 2 * 1024 * 1024) return { error: "Logo must be under 2 MB." };

  const { data: site } = await supabase.from("sites").select("logo_path").eq("owner_id", user.id).maybeSingle();
  if (!site) return { error: "No domain set." };

  // A new filename each time sidesteps CDN/browser caching of the old logo.
  const path = `${user.id}/logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("sites").update({ logo_path: path }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  if (site.logo_path) await supabase.storage.from("logos").remove([site.logo_path]);
  revalidatePath("/dashboard");
  return { ok: "Logo updated." };
}

export async function removeLogo() {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("logo_path").eq("owner_id", user.id).maybeSingle();
  if (site?.logo_path) await supabase.storage.from("logos").remove([site.logo_path]);
  await supabase.from("sites").update({ logo_path: null }).eq("owner_id", user.id);
  revalidatePath("/dashboard");
}

export async function saveAbout(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return { error: "No domain set." };

  const about_enabled = formData.get("about_enabled") === "on";
  const about_label = String(formData.get("about_label")).trim() || "About Us";
  const { error } = await supabase.from("sites").update({ about_enabled, about_label }).eq("id", site.id);
  if (error) return { error: error.message };

  // Fields are named section_<key> for each row in about_section_types; blank means "no section".
  const { data: types } = await supabase.from("about_section_types").select("key");
  const filled: { site_id: string; type_key: string; content: string }[] = [];
  const emptied: string[] = [];
  for (const { key } of types ?? []) {
    const content = String(formData.get(`section_${key}`) ?? "").trim();
    if (content) filled.push({ site_id: site.id, type_key: key, content });
    else emptied.push(key);
  }
  if (filled.length) {
    const { error } = await supabase.from("about_sections").upsert(filled);
    if (error) return { error: error.message };
  }
  if (emptied.length) await supabase.from("about_sections").delete().eq("site_id", site.id).in("type_key", emptied);

  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveLogoSize(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const logo_size = Math.round(Number(formData.get("logo_size")));
  if (!(logo_size >= 1 && logo_size <= 10)) return { error: "Size must be between 1 and 10." };
  const { error } = await supabase.from("sites").update({ logo_size }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveDirectorsSettings(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const labels = {} as FieldLabels;
  for (const f of DIRECTOR_FIELDS) labels[f] = String(formData.get(`label_${f}`) ?? "").trim() || DEFAULT_FIELD_LABELS[f];
  const layout = String(formData.get("directors_layout"));
  const shape = String(formData.get("directors_photo_shape"));
  if (!DIRECTOR_LAYOUTS.some((l) => l.key === layout) || !PHOTO_SHAPES.some((s) => s.key === shape)) {
    return { error: "Pick a layout and a photo shape." };
  }
  const { error } = await supabase
    .from("sites")
    .update({
      directors_layout: layout,
      directors_photo_shape: shape,
      directors_enabled: formData.get("directors_enabled") === "on",
      directors_label: String(formData.get("directors_label")).trim() || "Directors",
      directors_field_labels: labels,
    })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveDirector(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return { error: "No domain set." };

  const name = String(formData.get("name")).trim();
  if (!name) return { error: "Name is required." };

  let photo_path: string | null = null;
  if (id) {
    const { data: existing } = await supabase.from("directors").select("photo_path").eq("id", id).eq("site_id", site.id).maybeSingle();
    if (!existing) return { error: "Not found." };
    photo_path = existing.photo_path;
  }

  const oldPhoto = photo_path;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { error: "Photo must be a PNG, JPG, WebP or SVG." };
    if (file.size > 2 * 1024 * 1024) return { error: "Photo must be under 2 MB." };
    const path = `${user.id}/director-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type });
    if (error) return { error: error.message };
    photo_path = path;
  } else if (formData.get("remove_photo") === "on") {
    photo_path = null;
  }

  const row = {
    name,
    title: String(formData.get("title") ?? "").trim(),
    affiliation: String(formData.get("affiliation") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    photo_path,
  };
  const { error } = id
    ? await supabase.from("directors").update(row).eq("id", id).eq("site_id", site.id)
    : await supabase.from("directors").insert({ ...row, site_id: site.id });
  if (error) return { error: error.message };

  if (oldPhoto && oldPhoto !== photo_path) await supabase.storage.from("logos").remove([oldPhoto]);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteDirector(id: string) {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return;
  const { data: d } = await supabase.from("directors").select("photo_path").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (d?.photo_path) await supabase.storage.from("logos").remove([d.photo_path]);
  await supabase.from("directors").delete().eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
