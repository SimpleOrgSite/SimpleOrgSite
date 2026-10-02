import Link from "next/link";
import { redirect } from "next/navigation";
import { fieldLabels } from "@/lib/directors";
import { createClient } from "@/lib/supabase/server";
import { DirectorForm } from "../director-form";

export const dynamic = "force-dynamic";

export default async function NewDirector() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: site } = await supabase.from("sites").select("directors_label, directors_field_labels").eq("owner_id", auth.user.id).maybeSingle();
  if (!site) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <Link href="/dashboard" className="text-sm text-gray-500 underline">← Back</Link>
      <h1 className="text-2xl font-semibold">Add to {site.directors_label}</h1>
      <DirectorForm director={null} labels={fieldLabels(site.directors_field_labels)} photoUrl={null} />
    </main>
  );
}
