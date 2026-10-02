import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: PageProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <h1 className="text-center text-4xl font-semibold">{site.message}</h1>
    </div>
  );
}
