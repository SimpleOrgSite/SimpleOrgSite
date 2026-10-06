import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPages, getSite } from "@/lib/site";
import { PageView } from "../page-view";

export const dynamic = "force-dynamic";

async function find(domain: string, slug: string) {
  const site = await getSite(domain);
  if (!site) return {};
  const page = (await getPages(site.id)).find((p) => !p.is_home && p.slug === slug);
  return { site, page };
}

export async function generateMetadata({ params }: PageProps<"/site/[domain]/[slug]">): Promise<Metadata> {
  const { domain, slug } = await params;
  const { site, page } = await find(domain, slug);
  return page && site ? { title: `${page.title} | ${site.site_name || decodeURIComponent(domain)}` } : {};
}

export default async function CustomPage({ params }: PageProps<"/site/[domain]/[slug]">) {
  const { domain, slug } = await params;
  const { site, page } = await find(domain, slug);
  if (!site || !page) notFound();
  return <PageView site={site} page={page} />;
}
