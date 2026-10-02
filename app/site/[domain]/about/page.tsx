import { notFound } from "next/navigation";
import { getAboutSections, getDirectors, getSite, logoUrl } from "@/lib/site";
import { DirectorsView } from "./directors-view";

export const dynamic = "force-dynamic";

// One page: every filled-in section plus Directors. The header dropdown links to each by #id.
export default async function AboutPage({ params }: PageProps<"/site/[domain]/about">) {
  const { domain } = await params;
  const site = await getSite(domain);
  // A disabled section behaves as if it doesn't exist.
  if (!site?.about_enabled) notFound();

  const sections = (await getAboutSections(site.id)).filter((s) => s.content);
  const directors = site.directors_enabled
    ? await Promise.all((await getDirectors(site.id)).map(async ({ photo_path, ...d }) => ({ ...d, photoUrl: await logoUrl(photo_path) })))
    : [];

  return (
    <article className="mx-auto max-w-4xl space-y-12 px-6 py-12">
      <h1 className="text-3xl font-semibold">{site.about_label || "About Us"}</h1>
      {sections.map((s) => (
        <section key={s.key} id={s.key} className="max-w-3xl scroll-mt-6 space-y-3">
          <h2 className="text-xl font-semibold">{s.label}</h2>
          {/* pre-line keeps the owner's paragraph breaks without needing an editor or HTML. */}
          <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">{s.content}</p>
        </section>
      ))}
      {directors.length > 0 && (
        <section id="directors" className="scroll-mt-6 space-y-6">
          <h2 className="text-xl font-semibold">{site.directors_label || "Directors"}</h2>
          <DirectorsView directors={directors} layout={site.directors_layout} shape={site.directors_photo_shape} />
        </section>
      )}
    </article>
  );
}
