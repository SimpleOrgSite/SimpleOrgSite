import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { blockType, collectImagePaths, type HomeBlock } from "@/lib/blocks";
import { logoUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { BlockForm } from "../block-form";

export const dynamic = "force-dynamic";

export default async function EditBlock({ params }: PageProps<"/dashboard/blocks/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: site } = await supabase.from("sites").select("id").eq("owner_id", auth.user.id).maybeSingle();
  if (!site) redirect("/dashboard");

  const { data } = await supabase.from("home_blocks").select("id, type, enabled, config").eq("id", id).eq("site_id", site.id).maybeSingle();
  const def = data && blockType(data.type);
  if (!data || !def) notFound();
  const block = data as HomeBlock;

  const urls: Record<string, string> = {};
  for (const path of collectImagePaths(block.config)) urls[path] = (await logoUrl(path)) ?? "";

  return (
    <div className="flex-1 bg-gray-50">
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Link href="/dashboard?tab=home" className="text-sm text-gray-500 transition hover:text-gray-900">← Back</Link>
        <h1 className="text-2xl font-semibold">{def.label}</h1>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <BlockForm block={block} fields={def.fields} urls={urls} />
        </div>
      </main>
    </div>
  );
}
