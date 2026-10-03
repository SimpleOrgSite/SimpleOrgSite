import { sanitizeRichText } from "@/lib/richtext";

// Safe to import from client components (no server code).
export type NewsItem = { id: string; name: string; story: string; link: string; tags: string[]; visible: boolean };

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
