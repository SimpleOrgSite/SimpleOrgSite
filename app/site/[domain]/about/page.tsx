import { notFound } from "next/navigation";
import { getAboutSections, getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: PageProps<"/site/[domain]/about">) {
  const { domain } = await params;
  const site = await getSite(domain);
  // A disabled section behaves as if it doesn't exist.
  if (!site?.about_enabled) notFound();

  const sections = (await getAboutSections(site.id)).filter((s) => s.content);

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-6 py-12">
      <h1 className="text-3xl font-semibold">{site.about_label || "About Us"}</h1>
      {sections.map((s) => (
        <section key={s.key} className="space-y-3">
          <h2 className="text-xl font-semibold">{s.label}</h2>
          {/* pre-line keeps the owner's paragraph breaks without needing an editor or HTML. */}
          <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">{s.content}</p>
        </section>
      ))}
    </article>
  );
}
