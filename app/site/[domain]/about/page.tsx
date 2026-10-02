import { notFound } from "next/navigation";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: PageProps<"/site/[domain]/about">) {
  const { domain } = await params;
  const site = await getSite(domain);
  // A disabled section behaves as if it doesn't exist.
  if (!site?.about_enabled) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">About Us</h1>
      {/* pre-line keeps the owner's paragraph breaks without needing an editor or HTML. */}
      <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">{site.about_content}</p>
    </article>
  );
}
