import { sanitizeRichText } from "@/lib/richtext";

// Safe to import from client components (no server code).
export type NewsItem = { id: string; name: string; story: string; link: string; tags: string[]; visible: boolean; published_on: string | null };

export const NEWS_LAYOUTS = [
  { key: "full", label: "Full cards", hint: "Shows the first 5 lines of each story, with a button to expand" },
  { key: "compact", label: "Small cards", hint: "Just the name and link, with a button to expand the rest" },
  { key: "list", label: "Headline list", hint: "One slim row per story, with a button to expand. Best for lots of stories" },
  { key: "featured", label: "Featured + grid", hint: "Your top story shown large, the rest in a grid of smaller cards" },
  { key: "timeline", label: "Timeline", hint: "Stories along a vertical line, newest date first" },
] as const;
export type NewsLayout = (typeof NEWS_LAYOUTS)[number]["key"];

// "YYYY-MM-DD" or null. Anything else (including impossible dates like 2026-02-31) becomes null.
export function normalizeDate(raw: string): string | null {
  const v = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

// UTC on both ends so the server and browser always agree on the day.
export const formatNewsDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// Newest date first; undated stories and ties keep the owner's manual order (Array.sort is stable).
export const sortByDateDesc = <T extends { published_on: string | null }>(items: T[]) =>
  [...items].sort((a, b) => (b.published_on ?? "").localeCompare(a.published_on ?? ""));

const MAX_TAGS = 10;

// Trim, collapse spaces, drop blanks and case-insensitive duplicates (keeping the first spelling).
export function normalizeTags(raw: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const tag = t.replace(/\s+/g, " ").trim().slice(0, 30);
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      out.push(tag);
    }
  }
  return out.slice(0, MAX_TAGS);
}

// "" for none, null for something that isn't a usable web address. Bare "example.com" gets https://.
export function normalizeLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const storyText = (story: string) => sanitizeRichText(story).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Shared by the admin list and the public page: text matches name, story or tags; a tag filter must match exactly.
export function matchesNews(item: Pick<NewsItem, "name" | "story" | "tags">, query: string, tag: string | null) {
  if (tag && !item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.name, storyText(item.story), ...item.tags].some((s) => s.toLowerCase().includes(q));
}

export const allTags = (items: Pick<NewsItem, "tags">[]) => {
  const byKey = new Map<string, string>();
  for (const i of items) for (const t of i.tags) if (!byKey.has(t.toLowerCase())) byKey.set(t.toLowerCase(), t);
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
};

// Story screens return to wherever they were opened from (a news block's editor). Only those places are allowed, so a
// "back" value in a link can't send someone elsewhere.
export const DEFAULT_BACK = "/dashboard?tab=pages";
export const safeBack = (raw: string | undefined | null) => (raw && /^\/dashboard\/blocks\/[0-9a-f-]{36}$/i.test(raw) ? raw : DEFAULT_BACK);
