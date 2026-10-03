import Link from "next/link";
import { redirect } from "next/navigation";
import { allTags } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { NewsForm } from "../news-form";

export const dynamic = "force-dynamic";

export default async function NewStory() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: site } = await supabase.from("sites").select("id, news_label").eq("owner_id", auth.user.id).maybeSingle();
  if (!site) redirect("/dashboard");
  const { data: items } = await supabase.from("news_items").select("tags").eq("site_id", site.id);

  return (
    <div className="flex-1 bg-gray-50">
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Link href="/dashboard?tab=news" className="text-sm text-gray-500 transition hover:text-gray-900">← Back</Link>
        <h1 className="text-2xl font-semibold">Add to {site.news_label}</h1>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <NewsForm item={null} tagSuggestions={allTags(items ?? [])} />
        </div>
      </main>
    </div>
  );
}
