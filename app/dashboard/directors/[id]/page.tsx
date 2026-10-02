import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fieldLabels } from "@/lib/directors";
import { logoUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { DirectorForm } from "../director-form";

export const dynamic = "force-dynamic";

export default async function EditDirector({ params }: PageProps<"/dashboard/directors/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: site } = await supabase.from("sites").select("id, directors_field_labels").eq("owner_id", auth.user.id).maybeSingle();
  if (!site) redirect("/dashboard");

  const { data: director } = await supabase
    .from("directors")
    .select("id, name, title, affiliation, photo_path, bio, email")
    .eq("id", id)
    .eq("site_id", site.id)
    .maybeSingle();
  if (!director) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <Link href="/dashboard" className="text-sm text-gray-500 underline">← Back</Link>
      <h1 className="text-2xl font-semibold">{director.name}</h1>
      <DirectorForm director={director} labels={fieldLabels(site.directors_field_labels)} photoUrl={await logoUrl(director.photo_path)} />
    </main>
  );
}
