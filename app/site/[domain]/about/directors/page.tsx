import { notFound } from "next/navigation";
import { getDirectors, getSite, logoUrl } from "@/lib/site";
import { DirectorsView } from "./directors-view";

export const dynamic = "force-dynamic";

export default async function DirectorsPage({ params }: PageProps<"/site/[domain]/about/directors">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site?.about_enabled || !site.directors_enabled) notFound();

  const directors = await Promise.all(
    (await getDirectors(site.id)).map(async ({ photo_path, ...d }) => ({ ...d, photoUrl: await logoUrl(photo_path) })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      <h1 className="text-3xl font-semibold">{site.directors_label || "Directors"}</h1>
      <DirectorsView directors={directors} layout={site.directors_layout} shape={site.directors_photo_shape} />
    </div>
  );
}
