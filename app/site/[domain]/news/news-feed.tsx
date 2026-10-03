"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { allTags, matchesNews, type NewsItem } from "@/lib/news";
import { sanitizeRichText } from "@/lib/richtext";

const activeChip = { backgroundColor: "var(--theme-color, #111827)", color: "#fff" };

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = allTags(items);
  const shown = items.filter((i) => matchesNews(i, query, tag));
  const isActive = (t: string) => tag?.toLowerCase() === t.toLowerCase();
  const toggle = (t: string) => setTag(isActive(t) ? null : t);

  return (
    <div className="space-y-8">
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search news"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  style={isActive(t) ? activeChip : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${isActive(t) ? "" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {shown.map((item) => (
        <article key={item.id} className="space-y-4 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-2xl font-semibold">{item.name}</h2>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  style={isActive(t) ? activeChip : undefined}
                  className={`rounded-full px-3 py-1 text-xs transition ${isActive(t) ? "" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {item.story && <div className="rich text-lg leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.story) }} />}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--theme-color, #2563eb)" }}>
              Read more <Icon name="arrow-right" />
            </a>
          )}
        </article>
      ))}
      {shown.length === 0 && (
        <p className="py-10 text-center text-gray-500">{items.length ? "No stories match your search." : "Nothing here yet. Check back soon."}</p>
      )}
    </div>
  );
}
