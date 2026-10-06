import { notFound } from "next/navigation";
import { getPages, getSite } from "@/lib/site";
import { PageView } from "./page-view";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: PageProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();
  const page = (await getPages(site.id)).find((p) => p.is_home);
  return <PageView site={site} page={page} />;
}
