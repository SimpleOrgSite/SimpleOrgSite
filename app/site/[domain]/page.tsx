import { notFound } from "next/navigation";
import { collectImagePaths } from "@/lib/blocks";
import { getHomeBlocks, getSite, logoUrl } from "@/lib/site";
import { BlockView } from "./blocks";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: PageProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();

  // The announcement bar lives above the header (see the layout), so it isn't part of the stack.
  const blocks = (await getHomeBlocks(site.id)).filter((b) => b.type !== "announcement");

  // Until the owner turns on a block, keep showing the simple message.
  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <h1 className="text-center text-4xl font-semibold">{site.message}</h1>
      </div>
    );
  }

  const urls: Record<string, string> = {};
  for (const path of blocks.flatMap((b) => collectImagePaths(b.config))) urls[path] = (await logoUrl(path)) ?? "";

  return <>{blocks.map((b) => <BlockView key={b.id} block={b} urls={urls} />)}</>;
}
