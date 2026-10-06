import { Fragment } from "react";
import { blockAnchors, collectFilePaths, collectImagePaths, collectLibraryIds, fileKey, libraryKey } from "@/lib/blocks";
import { fileUrl, getLibraryLogos, getNews, getPageBlocks, logoUrl, type Site, type SitePage } from "@/lib/site";
import { BlockView } from "./blocks";

// One page of a site: its blocks, top to bottom. Home and every page the owner adds render through this.
export async function PageView({ site, page }: { site: Site; page: SitePage | undefined }) {
  const all = page ? await getPageBlocks(page.id) : [];
  // Anchors are worked out over every block of the page so they match the ones offered in the dashboard's link picker.
  const anchors = blockAnchors(all);
  // The announcement bar lives above the header (see the layout), so it isn't part of the stack.
  const blocks = all.filter((b) => b.type !== "announcement");

  if (blocks.length === 0) {
    // An empty home page keeps showing the simple message; an empty page shows its title so it isn't a blank screen.
    return !page || page.is_home ? (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <h1 className="text-center text-4xl font-semibold">{site.message}</h1>
      </div>
    ) : (
      <div className="mx-auto max-w-3xl space-y-3 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold">{page.title}</h1>
        <p className="text-gray-500">Nothing here yet.</p>
      </div>
    );
  }

  const urls: Record<string, string> = {};
  for (const path of blocks.flatMap((b) => collectImagePaths(b.config))) urls[path] = (await logoUrl(path)) ?? "";
  for (const path of blocks.flatMap((b) => collectFilePaths(b.config))) urls[fileKey(path)] = await fileUrl(path);

  const wanted = new Set(blocks.flatMap((b) => collectLibraryIds(b.config)));
  if (wanted.size > 0) for (const l of await getLibraryLogos()) if (wanted.has(l.id)) urls[libraryKey(l.id)] = l.url;

  // Stories are only fetched when a news block needs them.
  const news = blocks.some((b) => b.type === "news_feed" || b.type === "news_list") ? await getNews(site.id) : [];

  return (
    <>
      {blocks.map((b) => {
        const view = <BlockView block={b} urls={urls} news={news} />;
        return anchors[b.id] ? <div key={b.id} id={anchors[b.id]}>{view}</div> : <Fragment key={b.id}>{view}</Fragment>;
      })}
    </>
  );
}
