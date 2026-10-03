import { notFound } from "next/navigation";
import { getNews, getSite } from "@/lib/site";
import { NewsFeed } from "./news-feed";

export const dynamic = "force-dynamic";

export default async function NewsPage({ params }: PageProps<"/site/[domain]/news">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site?.news_enabled) notFound();

  const items = await getNews(site.id);

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">{site.news_label || "News"}</h1>
      </div>
      <section className="border-t border-gray-200 bg-gradient-to-b from-slate-50 to-white">
        <div className={`mx-auto px-6 py-12 ${site.news_layout === "featured" ? "max-w-5xl" : "max-w-3xl"}`}>
          <NewsFeed items={items} layout={site.news_layout} />
        </div>
      </section>
    </div>
  );
}
