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

  // One ordered list so Directors alternates like every other section. Even positions get a soft gradient, odd stay white.
  const parts = [
    ...sections.map((s) => ({
      id: s.key,
      content: (
        <div className="space-y-3">
          <h2 className="text-center text-xl font-semibold">{s.label}</h2>
          {/* pre-line keeps the owner's paragraph breaks without needing an editor or HTML. */}
          <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-700">{s.content}</p>
        </div>
      ),
    })),
    ...(directors.length > 0
      ? [{
          id: "directors",
          content: (
            <div className="space-y-6">
              <h2 className="text-center text-xl font-semibold">{site.directors_label || "Directors"}</h2>
              <DirectorsView directors={directors} layout={site.directors_layout} shape={site.directors_photo_shape} />
            </div>
          ),
        }]
      : []),
  ];

  return (
    <article>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">{site.about_label || "About Us"}</h1>
      </div>
      {parts.map((part, i) => (
        <section
          key={part.id}
          id={part.id}
          className={`border-t border-gray-200 ${i % 2 === 0 ? "bg-gradient-to-b from-slate-50 to-white" : "bg-white"}`}
        >
          <div className="mx-auto max-w-4xl px-6 py-12">{part.content}</div>
        </section>
      ))}
    </article>
  );
}
