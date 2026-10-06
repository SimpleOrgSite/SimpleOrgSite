"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_ACTIONS, iconName, collectImagePaths, collectFilePaths, blockType, normalizeBlockLink, normalizeEmbed, videoEmbedUrl, type ActionItem, type BlockConfig, type BlockField } from "@/lib/blocks";
import { normalizeDate, normalizeLink, normalizeTags } from "@/lib/news";
import { sanitizeRichText } from "@/lib/richtext";
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

export async function saveLogoSize(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  const logo_size = Math.round(Number(formData.get("logo_size")));
  if (!(logo_size >= 1 && logo_size <= 10)) return { error: "Size must be between 1 and 10." };
  const { error } = await supabase.from("sites").update({ logo_size }).eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
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

export async function addBlock(pageId: string, type: string) {
  const def = blockType(type);
  const { supabase, site } = await currentSite();
  if (!def || !site) return;
  const { data: page } = await supabase.from("pages").select("id").eq("id", pageId).eq("site_id", site.id).maybeSingle();
  if (!page) return;
  // New blocks go to the bottom of the page.
  const { data: last } = await supabase.from("page_blocks").select("sort_order").eq("page_id", pageId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("page_blocks").insert({ site_id: site.id, page_id: pageId, type: def.type, config: def.defaults, sort_order: (last?.sort_order ?? -1) + 1 }).select("id").single();
  revalidatePath("/dashboard");
  // Surface failures (e.g. a table that hasn't been created yet) instead of silently reloading the same tab.
  if (error || !data) redirect(`/dashboard?tab=p-${pageId}&error=${encodeURIComponent(error?.message ?? "Couldn't add the block.")}`);
  redirect(`/dashboard/blocks/${data.id}`);
}

export async function saveBlock(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user, site } = await currentSite();
  if (!site) return { error: "No domain set." };
  const { data: block } = await supabase.from("page_blocks").select("type, config").eq("id", id).eq("site_id", site.id).maybeSingle();
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
          } else if (sub.kind === "year") {
            const y = String(formData.get(name) ?? "").trim();
            row[sub.key] = /^\d{4}$/.test(y) ? y : "";
          } else if (sub.kind === "select") {
            const v = String(formData.get(name) ?? "");
            row[sub.key] = sub.options?.some((o) => o.value === v) ? v : "";
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

  const { error } = await supabase.from("page_blocks").update({ config }).eq("id", id).eq("site_id", site.id);
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

// Deletes the uploaded images and documents a set of block configs point at.
async function removeBlockFiles(supabase: Awaited<ReturnType<typeof createClient>>, configs: BlockConfig[]) {
  const images = configs.flatMap(collectImagePaths);
  if (images.length) await supabase.storage.from("logos").remove(images);
  const files = configs.flatMap(collectFilePaths);
  if (files.length) await supabase.storage.from("block-files").remove(files);
}

export async function deleteBlock(id: string) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: block } = await supabase.from("page_blocks").select("page_id, config").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (block) await removeBlockFiles(supabase, [block.config as BlockConfig]);
  await supabase.from("page_blocks").delete().eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
  redirect(`/dashboard?tab=${block ? `p-${block.page_id}` : "site"}`);
}

export async function toggleBlock(id: string, enabled: boolean) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  await supabase.from("page_blocks").update({ enabled }).eq("id", id).eq("site_id", site.id);
  revalidatePath("/dashboard");
}

export async function moveBlock(id: string, by: -1 | 1) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: me } = await supabase.from("page_blocks").select("page_id").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (!me) return;
  const { data: rows } = await supabase.from("page_blocks").select("id").eq("page_id", me.page_id).order("sort_order").order("created_at");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((rowId, order) => supabase.from("page_blocks").update({ sort_order: order }).eq("id", rowId).eq("site_id", site.id)));
  revalidatePath("/dashboard");
}

// ---- Pages -----------------------------------------------------------------------------------------------

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function addPage(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, site } = await currentSite();
  if (!site) return { error: "No domain set." };
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  if (!title) return { error: "Give the page a name." };
  const { data: existing } = await supabase.from("pages").select("slug, sort_order").eq("site_id", site.id);
  const used = new Set((existing ?? []).map((p) => p.slug));
  const base = slugify(title) || "page";
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  const sort = Math.max(0, ...(existing ?? []).map((p) => p.sort_order)) + 1;
  const { data, error } = await supabase.from("pages").insert({ site_id: site.id, slug, title, sort_order: sort }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Couldn't add the page." };
  revalidatePath("/dashboard");
  redirect(`/dashboard?tab=p-${data.id}`);
}

export async function savePage(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase, site } = await currentSite();
  if (!site) return { error: "No domain set." };
  const { data: page } = await supabase.from("pages").select("is_home").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (!page) return { error: "That page no longer exists." };
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  if (!title) return { error: "Give the page a name." };
  const row: { title: string; slug?: string; show_in_menu?: boolean } = { title };
  if (!page.is_home) {
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    if (!SLUG.test(slug)) return { error: "The address can only use lowercase letters, numbers and dashes, like our-team." };
    const { data: clash } = await supabase.from("pages").select("id").eq("site_id", site.id).eq("slug", slug).neq("id", id).maybeSingle();
    if (clash) return { error: "Another page already uses that address." };
    row.slug = slug;
    row.show_in_menu = formData.get("show_in_menu") === "on";
  }
  const { error } = await supabase.from("pages").update(row).eq("id", id).eq("site_id", site.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

export async function deletePage(id: string) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: page } = await supabase.from("pages").select("is_home").eq("id", id).eq("site_id", site.id).maybeSingle();
  if (!page || page.is_home) return;
  const { data: blocks } = await supabase.from("page_blocks").select("config").eq("page_id", id);
  await removeBlockFiles(supabase, (blocks ?? []).map((b) => b.config as BlockConfig));
  await supabase.from("pages").delete().eq("id", id).eq("site_id", site.id); // its blocks go with it
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=site");
}

export async function togglePageMenu(id: string, show: boolean) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  await supabase.from("pages").update({ show_in_menu: show }).eq("id", id).eq("site_id", site.id).eq("is_home", false);
  revalidatePath("/dashboard");
}

export async function movePage(id: string, by: -1 | 1) {
  const { supabase, site } = await currentSite();
  if (!site) return;
  const { data: rows } = await supabase.from("pages").select("id, is_home").eq("site_id", site.id).order("sort_order").order("created_at");
  // Home always stays first, so only the others trade places.
  const ids = (rows ?? []).filter((r) => !r.is_home).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i === -1 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const home = (rows ?? []).find((r) => r.is_home);
  const ordered = [...(home ? [home.id] : []), ...ids];
  await Promise.all(ordered.map((rowId, order) => supabase.from("pages").update({ sort_order: order }).eq("id", rowId).eq("site_id", site.id)));
  revalidatePath("/dashboard");
}
