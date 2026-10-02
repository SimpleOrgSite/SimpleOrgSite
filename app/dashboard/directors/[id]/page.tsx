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
    <div className="flex-1 bg-gray-50">
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link href="/dashboard?tab=about" className="text-sm text-gray-500 transition hover:text-gray-900">← Back</Link>
      <h1 className="text-2xl font-semibold">{director.name}</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"><DirectorForm director={director} labels={fieldLabels(site.directors_field_labels)} photoUrl={await logoUrl(director.photo_path)} /></div>
      </main>
    </div>
  );
}
