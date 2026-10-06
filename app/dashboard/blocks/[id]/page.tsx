import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { blockType, collectImagePaths, configText, type PageBlock } from "@/lib/blocks";
import { NewsList } from "../../news/news-list";
import { buttonSecondary } from "../../ui";
import { getLibraryLogos, logoUrl, sitePageLinks } from "@/lib/site";
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
  const block = data as PageBlock;

  const urls: Record<string, string> = {};
  for (const path of collectImagePaths(block.config)) urls[path] = (await logoUrl(path)) ?? "";

  // News blocks show the site's stories, so this is where those stories are managed.
  const isNews = def.type === "news_list" || def.type === "news_feed";
  const { data: stories } = isNews
    ? await supabase.from("news_items").select("id, name, story, link, tags, visible, published_on").eq("site_id", site.id).order("sort_order").order("created_at", { ascending: false })
    : { data: null };
  const here = `/dashboard/blocks/${id}`;

  return (
    <div className="flex-1 bg-gray-50">
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <Link href={`/dashboard?tab=p-${block.page_id}`} className="text-sm text-gray-500 transition hover:text-gray-900">← Back</Link>
        <h1 className="text-2xl font-semibold">{configText(block.config, "internal_name") || def.label}</h1>
        {configText(block.config, "internal_name") && <p className="-mt-4 text-sm text-gray-400">{def.label}</p>}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <BlockForm block={block} fields={def.fields} urls={urls} pages={await sitePageLinks(site.id)} library={await getLibraryLogos()} />
        </div>
        {isNews && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Stories</h2>
                <p className="mt-1 text-sm text-gray-500">Shared by every news block on your site. Newest first by default; reorder with the arrows.</p>
              </div>
              <Link href={`/dashboard/news/new?back=${encodeURIComponent(here)}`} className={buttonSecondary}>Add story</Link>
            </div>
            <NewsList items={stories ?? []} back={here} />
          </section>
        )}
      </main>
    </div>
  );
}
