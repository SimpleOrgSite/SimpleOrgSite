"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_ACTIONS, iconName, collectImagePaths, collectFilePaths, blockType, normalizeBlockLink, normalizeEmbed, videoEmbedUrl, type ActionItem, type BlockConfig, type BlockField } from "@/lib/blocks";
import { NEWS_LAYOUTS, normalizeDate, normalizeLink, normalizeTags } from "@/lib/news";
import { hasText, sanitizeRichText } from "@/lib/richtext";
import { DIRECTOR_LAYOUTS, PHOTO_SHAPES } from "@/lib/directors";
import { getLibraryLogos } from "@/lib/site";
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
  const show_name_with_logo = formData.get("show_name_with_logo") === "on";
  const { error } = await supabase.from("sites").update({ site_name, show_name_with_logo }).eq("owner_id", user.id);
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

  // The three fields are parallel lists in on-screen order; position becomes sort_order.
  const ids = formData.getAll("section_id").map(String);
  const titles = formData.getAll("section_title").map(String);
  const bodies = formData.getAll("section_body").map(String);
  const rows = ids
    .map((id, i) => ({ id, title: titles[i].trim(), body: sanitizeRichText(bodies[i]) }))
    .filter((r) => /^[0-9a-f-]{36}$/i.test(r.id) && (r.title || hasText(r.body)))
    .map((r, i) => ({ ...r, site_id: site.id, sort_order: i }));

  if (rows.length) {
    const { error } = await supabase.from("about_sections").upsert(rows);
    if (error) return { error: error.message };
  }
  // Anything the owner removed from the form is deleted.
  const keep = rows.map((r) => r.id);
  const del = supabase.from("about_sections").delete().eq("site_id", site.id);
  await (keep.length ? del.not("id", "in", `(${keep.join(",")})`) : del);

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
  redirect("/dashboard?tab=about");
}

export async function deleteDirector(id: string) {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return;
  const { data: d } = await supabase.from("directors").select("photo_path").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (d?.photo_path) await supabase.storage.from("logos").remove([d.photo_path]);
  await supabase.from("directors").delete().eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=about");
}

export async function saveHeaderStyle(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const header_style = String(formData.get("header_style"));
  const theme_color = String(formData.get("theme_color"));
  if (header_style !== "light" && header_style !== "dark") return { error: "Pick light or dark." };
  if (!/^#[0-9a-f]{6}$/i.test(theme_color)) return { error: "Pick a valid color." };
  const { error } = await supabase.from("sites").update({ header_style, theme_color: theme_color.toLowerCase() }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveFooter(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const footer_style = String(formData.get("footer_style"));
  if (footer_style !== "light" && footer_style !== "dark") return { error: "Pick light or dark." };
  const footer_email = String(formData.get("footer_email") ?? "").trim();
  if (footer_email && !/^\S+@\S+\.\S+$/.test(footer_email)) return { error: "That doesn't look like a valid email address." };
  const on = (name: string) => formData.get(name) === "on";
  const { error } = await supabase
    .from("sites")
    .update({
      footer_match_header: on("footer_match_header"),
      footer_style,
      footer_show_logo: on("footer_show_logo"),
      footer_show_name: on("footer_show_name"),
      footer_show_copyright: on("footer_show_copyright"),
      footer_show_nav: on("footer_show_nav"),
      footer_show_email: on("footer_show_email"),
      footer_email,
    })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveNewsSettings(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const { error } = await supabase
    .from("sites")
    .update({
      news_enabled: formData.get("news_enabled") === "on",
      news_label: String(formData.get("news_label")).trim() || "News",
      news_layout: NEWS_LAYOUTS.find((l) => l.key === formData.get("news_layout"))?.key ?? "full",
    })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function saveNewsItem(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return { error: "No domain set." };

  const name = String(formData.get("name")).trim();
  if (!name) return { error: "Name is required." };
  const link = normalizeLink(String(formData.get("link") ?? ""));
  if (link === null) return { error: "The link must be a web address, like https://example.com." };

  const row = {
    name,
    story: sanitizeRichText(String(formData.get("story") ?? "")),
    link,
    tags: normalizeTags(formData.getAll("tag").map(String)),
    visible: formData.get("visible") === "on",
    published_on: normalizeDate(String(formData.get("published_on") ?? "")),
  };

  if (id) {
    const { error } = await supabase.from("news_items").update(row).eq("id", id).eq("site_id", site.id);
    if (error) return { error: error.message };
  } else {
    // New stories go to the top of the list.
    const { data: first } = await supabase.from("news_items").select("sort_order").eq("site_id", site.id).order("sort_order").limit(1).maybeSingle();
    const { error } = await supabase.from("news_items").insert({ ...row, site_id: site.id, sort_order: (first?.sort_order ?? 1) - 1 });
    if (error) return { error: error.message };
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=news");
}

export async function deleteNewsItem(id: string) {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return;
  await supabase.from("news_items").delete().eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=news");
}

export async function toggleNewsVisible(id: string, visible: boolean) {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return;
  await supabase.from("news_items").update({ visible }).eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
}

export async function moveNewsItem(id: string, by: -1 | 1) {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  if (!site) return;
  const { data: rows } = await supabase.from("news_items").select("id").eq("site_id", site.id).order("sort_order").order("created_at", { ascending: false });
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  // Renumber everything so ties from older rows can't make the swap a no-op.
  await Promise.all(ids.map((rowId, order) => supabase.from("news_items").update({ sort_order: order }).eq("id", rowId).eq("site_id", site.id)));
  revalidatePath("/dashboard");
}

// Block images share the logos bucket and documents use block-files; both are uploaded by the browser (see lib/upload.ts).
async function currentSite() {
  const { supabase, user } = await currentUser();
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", user.id).maybeSingle();
  return { supabase, user, site };
}

export async function addBlock(type: string) {
  const def = blockType(type);
  const { supabase, site } = await currentSite();
  if (!def || !site) return;
  // New blocks go to the bottom of the page.
  const { data: last } = await supabase.from("home_blocks").select("sort_order").eq("site_id", site.id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("home_blocks").insert({ site_id: site.id, type: def.type, config: def.defaults, sort_order: (last?.sort_order ?? -1) + 1 }).select("id").single();
  revalidatePath("/dashboard");
  // Surface failures (e.g. the table hasn't been created yet) instead of silently reloading the same tab.
  if (error || !data) redirect(`/dashboard?tab=home&error=${encodeURIComponent(error?.message ?? "Couldn't add the block.")}`);
  redirect(`/dashboard/blocks/${data.id}`);
}

export async function saveBlock(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user, site } = await currentSite();
  if (!site) return { error: "No domain set." };
  const { data: block } = await supabase.from("home_blocks").select("type, config").eq("id", id).eq("site_id", site.id).maybeSingle();
  const def = block && blockType(block.type);
  if (!block || !def) return { error: "That block no longer exists." };

  const old = block.config as BlockConfig;
  // Files are uploaded by the browser straight to Storage; the form carries only paths. The form is user input, so a path
  // is accepted only if this block already owned it, or it has exactly the shape the uploader generates inside the owner's own folder.
  const owned = new Set(collectImagePaths(old));
  const ownedFiles = new Set(collectFilePaths(old));
  const freshImage = new RegExp(`^${user.id}/block-[\\w.-]+$`);
  const freshFile = new RegExp(`^${user.id}/doc-[\\w.-]+\\.(pdf|doc|docx)$`);
  const justUploaded = new Set<string>();
  const fail = (error: string): FormState => ({ error });
  // One image input: a just-uploaded file wins, then "remove", else the existing file stays.
  const imageValue = (name: string): { path: string | null } => {
    const fresh = String(formData.get(`${name}_new`) ?? "");
    if (freshImage.test(fresh)) {
      justUploaded.add(fresh);
      return { path: fresh };
    }
    const keep = String(formData.get(`${name}_path`) ?? "");
    return { path: formData.get(`${name}_remove`) !== "on" && owned.has(keep) ? keep : null };
  };
  const fileValue = (name: string): { path: string; filename: string } | null => {
    const path = String(formData.get(`${name}_file`) ?? "");
    if (!ownedFiles.has(path) && !freshFile.test(path)) return null;
    return { path, filename: String(formData.get(`${name}_filename`) ?? "").slice(0, 120) };
  };

  // Every block has an owner-only label, shown in the dashboard and never on the site.
  const config: BlockConfig = { internal_name: String(formData.get("internal_name") ?? "").trim().slice(0, 60) };
  for (const f of def.fields as readonly BlockField[]) {
    if (f.kind === "text" || f.kind === "textarea") {
      config[f.key] = String(formData.get(f.key) ?? "").trim();
    } else if (f.kind === "embed") {
      const embed = normalizeEmbed(String(formData.get(f.key) ?? ""));
      if (embed === null) return fail("That doesn't look like a form embed. Paste the embed code or the https:// link from your form provider.");
      config[f.key] = embed;
    } else if (f.kind === "video") {
      const video = videoEmbedUrl(String(formData.get(f.key) ?? ""));
      if (video === null) return fail("That doesn't look like a YouTube or Vimeo link.");
      config[f.key] = video;
    } else if (f.kind === "richtext") {
      config[f.key] = sanitizeRichText(String(formData.get(f.key) ?? ""));
    } else if (f.kind === "link") {
      const link = normalizeBlockLink(String(formData.get(f.key) ?? ""));
      if (link === null) return fail(`${f.label}: use a web address, a page like /about, or a phone or email link.`);
      config[f.key] = link;
    } else if (f.kind === "choice") {
      const v = String(formData.get(f.key));
      config[f.key] = f.options.find((o) => o.value === v)?.value ?? f.options[0].value;
    } else if (f.kind === "actions") {
      const items: ActionItem[] = [];
      for (let i = 0; i < MAX_ACTIONS; i++) {
        const label = String(formData.get(`item_label_${i}`) ?? "").trim();
        const link = normalizeBlockLink(String(formData.get(`item_link_${i}`) ?? ""));
        if (link === null) return fail(`Button ${i + 1}: use a web address, a page like /about, or a phone or email link.`);
        if (label) items.push({ icon: iconName(formData.get(`item_icon_${i}`)), label, link });
      }
      config[f.key] = items;
    } else if (f.kind === "image") {
      config[`${f.key}_path`] = imageValue(f.key).path;
    } else if (f.kind === "list") {
      // rows arrive in page order as repeated "<key>__rows" uids, each row's inputs named "<key>__<uid>__<sub>".
      const rows: Record<string, string | null>[] = [];
      for (const uid of formData.getAll(`${f.key}__rows`).map(String).slice(0, f.max)) {
        const row: Record<string, string | null> = {};
        let filled = false;
        let libraryName = "";
        for (const sub of f.fields) {
          const name = `${f.key}__${uid}__${sub.key}`;
          if (sub.kind === "image") {
            const res = imageValue(name);
            // A logo picked from the shared library replaces any file of their own, unless they just uploaded a new one.
            const picked = String(formData.get(`${name}_lib`) ?? "");
            const wasJustUploaded = justUploaded.has(res.path ?? "");
            const hit = sub.library && picked && !wasJustUploaded ? (await getLibraryLogos()).find((l) => l.id === picked && l.category === sub.library) : undefined;
            row[`${sub.key}_path`] = hit ? null : res.path;
            if (sub.library) row[`${sub.key}_lib`] = hit?.id ?? "";
            if (hit) libraryName = hit.name;
            filled ||= !!res.path || !!hit;
          } else if (sub.kind === "file") {
            const file = fileValue(name);
            row[`${sub.key}_file`] = file?.path ?? null;
            row[`${sub.key}_filename`] = file?.filename ?? null;
            filled ||= !!file;
          } else if (sub.kind === "link") {
            const link = normalizeBlockLink(String(formData.get(name) ?? ""));
            if (link === null) return fail(`${sub.label}: use a web address, a page like /about, or a phone or email link.`);
            row[sub.key] = link;
          } else if (sub.kind === "icon") {
            // An icon alone doesn't make a row worth keeping.
            row[sub.key] = iconName(formData.get(name));
          } else {
            row[sub.key] = String(formData.get(name) ?? "").trim();
            filled ||= !!row[sub.key];
          }
        }
        // A library pick names the row for them if they left the name blank.
        if (libraryName && "name" in row && !row.name) row.name = libraryName;
        if (filled) rows.push(row);
      }
      config[f.key] = rows;
    }
  }

  const { error } = await supabase.from("home_blocks").update({ config }).eq("id", id).eq("site_id", site.id);
  if (error) return fail(error.message);
  const kept = new Set(collectImagePaths(config));
  const unused = [...owned].filter((p) => !kept.has(p));
  if (unused.length) await supabase.storage.from("logos").remove(unused);
  const keptFiles = new Set(collectFilePaths(config));
  const unusedFiles = [...ownedFiles].filter((p) => !keptFiles.has(p));
  if (unusedFiles.length) await supabase.storage.from("block-files").remove(unusedFiles);
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function deleteBlock(id: string) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: block } = await supabase.from("home_blocks").select("config").eq("id", id).eq("site_id", site.id).maybeSingle();
  const images = block ? collectImagePaths(block.config as BlockConfig) : [];
  if (images.length) await supabase.storage.from("logos").remove(images);
  const files = block ? collectFilePaths(block.config as BlockConfig) : [];
  if (files.length) await supabase.storage.from("block-files").remove(files);
  await supabase.from("home_blocks").delete().eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=home");
}

export async function toggleBlock(id: string, enabled: boolean) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  await supabase.from("home_blocks").update({ enabled }).eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
}

export async function moveBlock(id: string, by: -1 | 1) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: rows } = await supabase.from("home_blocks").select("id").eq("site_id", site.id).order("sort_order").order("created_at");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((rowId, order) => supabase.from("home_blocks").update({ sort_order: order }).eq("id", rowId).eq("site_id", site.id)));
  revalidatePath("/dashboard");
}
