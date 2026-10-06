"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { allTags, formatNewsDate, matchesNews, type NewsItem } from "@/lib/news";
import { moveNewsItem, toggleNewsVisible } from "../actions";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

export function NewsList({ items, back }: { items: NewsItem[]; back: string }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = allTags(items);
  const shown = items.filter((i) => matchesNews(i, query, tag));
  // Moving swaps neighbours in the full list, which would be confusing while the view is filtered.
  const filtering = !!query.trim() || !!tag;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories and tags"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(tag?.toLowerCase() === t.toLowerCase() ? null : t)}
                  className={`rounded-full px-3 py-1 text-sm transition ${tag?.toLowerCase() === t.toLowerCase() ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {shown.length > 0 ? (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
          {shown.map((item) => {
            const index = items.indexOf(item);
            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/dashboard/news/${item.id}?back=${encodeURIComponent(back)}`} className="min-w-0 flex-1 space-y-1">
                  <span className={`block truncate font-medium ${item.visible ? "" : "text-gray-400"}`}>{item.name}</span>
                  {item.published_on && <span className="block text-xs text-gray-500">{formatNewsDate(item.published_on)}</span>}
                  {item.tags.length > 0 && (
                    <span className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>)}
                    </span>
                  )}
                </Link>
                <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${item.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.visible ? "Shown" : "Hidden"}
                </span>
                <form action={toggleNewsVisible.bind(null, item.id, !item.visible)}>
                  <button aria-label={item.visible ? "Hide from site" : "Show on site"} title={item.visible ? "Hide from site" : "Show on site"} className={iconButton}>
                    <Icon name={item.visible ? "eye" : "eye-off"} />
                  </button>
                </form>
                <div className="flex">
                  <form action={moveNewsItem.bind(null, item.id, -1)}>
                    <button aria-label="Move up" title="Move up" disabled={filtering || index === 0} className={iconButton}><Icon name="arrow-up" /></button>
                  </form>
                  <form action={moveNewsItem.bind(null, item.id, 1)}>
                    <button aria-label="Move down" title="Move down" disabled={filtering || index === items.length - 1} className={iconButton}><Icon name="arrow-down" /></button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          {items.length ? "No stories match your search." : "No stories yet."}
        </p>
      )}
      {filtering && shown.length > 0 && <p className="text-xs text-gray-500">Clear the search or tag filter to change the order.</p>}
    </div>
  );
}
