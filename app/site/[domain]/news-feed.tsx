"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { allTags, formatNewsDate, matchesNews, sortByDateDesc, type NewsItem, type NewsLayout } from "@/lib/news";
import { sanitizeRichText } from "@/lib/richtext";

const THEME = "var(--theme-color, #111827)";
const activeChip = { backgroundColor: THEME, color: "#fff" };

type TagProps = { isActive: (t: string) => boolean; toggle: (t: string) => void };

function Tags({ tags, isActive, toggle }: { tags: string[] } & TagProps) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
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
  );
}

// A real button look: theme-color background with white text (same rule as the dark header).
function ReadMore({ href, small }: { href: string; small?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-xl font-medium text-white shadow-sm transition hover:opacity-85 ${small ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5"}`}
      style={{ backgroundColor: THEME }}
    >
      Read more
    </a>
  );
}

const DateLine = ({ date, className = "" }: { date: string | null; className?: string }) =>
  date ? <p className={`text-sm text-gray-500 ${className}`}>{formatNewsDate(date)}</p> : null;

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5";
const expandButton = "inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-900";
const chevron = (open: boolean, size = "h-4 w-4") => `${size} transition-transform ${open ? "rotate-180" : ""}`;

// Cards that clamp the story and offer Show more only when it's actually longer than the clamp.
const VARIANTS = {
  default: { pad: "p-7", title: "text-2xl", text: "text-lg", clamp: "line-clamp-5" },
  grid: { pad: "p-5", title: "text-lg", text: "text-base", clamp: "line-clamp-3" },
  feature: { pad: "p-8", title: "text-3xl", text: "text-lg", clamp: "" },
} as const;

function StoryCard({ item, variant = "default", ...tagProps }: { item: NewsItem; variant?: keyof typeof VARIANTS } & TagProps) {
  const v = VARIANTS[variant];
  const body = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el || expanded || !v.clamp) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure); // line wrapping changes with the window width
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, item.story, v.clamp]);

  return (
    <article className={`${card} space-y-4 ${v.pad}`}>
      <div className="space-y-1">
        <DateLine date={item.published_on} />
        <h2 className={`${v.title} font-semibold leading-snug`}>{item.name}</h2>
      </div>
      <Tags tags={item.tags} {...tagProps} />
      {item.story && (
        <div
          ref={body}
          className={`rich ${v.text} leading-relaxed text-gray-700 ${expanded ? "" : v.clamp}`}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.story) }}
        />
      )}
      {(overflows || expanded) && (
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className={expandButton}>
          {expanded ? "Show less" : "Show more"}
          <Icon name="chevron-down" className={chevron(expanded)} />
        </button>
      )}
      {item.link && <div><ReadMore href={item.link} /></div>}
    </article>
  );
}

// Just the name and link until expanded.
function CompactCard({ item, ...tagProps }: { item: NewsItem } & TagProps) {
  const [open, setOpen] = useState(false);
  const expandable = !!item.story || item.tags.length > 0 || !!item.published_on;
  return (
    <article className={`${card} space-y-3 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-snug">{item.name}</h2>
        {expandable && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Icon name="chevron-down" className={chevron(open, "h-5 w-5")} />
          </button>
        )}
      </div>
      {item.link && <div><ReadMore href={item.link} small /></div>}
      {open && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <DateLine date={item.published_on} />
          <Tags tags={item.tags} {...tagProps} />
          {item.story && <div className="rich text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.story) }} />}
        </div>
      )}
    </article>
  );
}

// A slim row: date and name on the left, link and chevron on the right, story below when open.
function HeadlineRow({ item, ...tagProps }: { item: NewsItem } & TagProps) {
  const [open, setOpen] = useState(false);
  const expandable = !!item.story || item.tags.length > 0;
  return (
    <li className="py-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <DateLine date={item.published_on} className="!text-xs" />
          <h2 className="font-semibold leading-snug">{item.name}</h2>
        </div>
        {item.link && <ReadMore href={item.link} small />}
        {expandable && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Icon name="chevron-down" className={chevron(open, "h-5 w-5")} />
          </button>
        )}
      </div>
      {open && (
        <div className="space-y-3 pt-3">
          <Tags tags={item.tags} {...tagProps} />
          {item.story && <div className="rich text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.story) }} />}
        </div>
      )}
    </li>
  );
}

export function NewsFeed({ items, layout }: { items: NewsItem[]; layout: NewsLayout }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = allTags(items);
  const shown = items.filter((i) => matchesNews(i, query, tag));
  const isActive = (t: string) => tag?.toLowerCase() === t.toLowerCase();
  const toggle = (t: string) => setTag(isActive(t) ? null : t);
  const tagProps = { isActive, toggle };

  let list: React.ReactNode = null;
  if (layout === "compact") {
    // items-start so expanding one card doesn't stretch its neighbour.
    list = <div className="grid items-start gap-4 sm:grid-cols-2">{shown.map((i) => <CompactCard key={i.id} item={i} {...tagProps} />)}</div>;
  } else if (layout === "list") {
    list = <ul className="divide-y divide-gray-200 border-y border-gray-200">{shown.map((i) => <HeadlineRow key={i.id} item={i} {...tagProps} />)}</ul>;
  } else if (layout === "featured") {
    const [first, ...rest] = shown;
    list = (
      <div className="space-y-6">
        {first && <StoryCard item={first} variant="feature" {...tagProps} />}
        <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((i) => <StoryCard key={i.id} item={i} variant="grid" {...tagProps} />)}
        </div>
      </div>
    );
  } else if (layout === "timeline") {
    list = (
      <ol className="relative ml-2 space-y-10 border-l-2 border-gray-200">
        {sortByDateDesc(shown).map((i) => (
          <li key={i.id} className="relative pl-8">
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ring-4 ring-white" style={{ backgroundColor: THEME }} />
            <StoryCard item={i} {...tagProps} />
          </li>
        ))}
      </ol>
    );
  } else {
    list = shown.map((i) => <StoryCard key={i.id} item={i} {...tagProps} />);
  }

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
      {list}
      {shown.length === 0 && (
        <p className="py-10 text-center text-gray-500">{items.length ? "No stories match your search." : "Nothing here yet. Check back soon."}</p>
      )}
    </div>
  );
}
