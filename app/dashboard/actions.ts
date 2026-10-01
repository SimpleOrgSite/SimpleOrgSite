"use server";

import { revalidatePath } from "next/cache";
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
