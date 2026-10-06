import { BLOCK_TYPES, blockType, type BlockConfig, type HomeBlock } from "@/lib/blocks";
import type { NewsItem } from "@/lib/news";

// Sample content for the dashboard's "Preview" sheet, so every block can be shown without the owner filling anything in.
// A block's own defaults are the base; these add what its defaults leave empty (photos, an address, a video).

// Soft gradient pictures in the site's theme color, as data URLs so previews need no network and no uploaded files.
export function sampleImages(color: string): Record<string, string> {
  const art = (n: number) => {
    const shapes = [
      '<circle cx="900" cy="200" r="320" fill="#fff" fill-opacity=".16"/><circle cx="260" cy="640" r="260" fill="#fff" fill-opacity=".12"/>',
      '<circle cx="300" cy="260" r="300" fill="#fff" fill-opacity=".16"/><circle cx="880" cy="620" r="280" fill="#fff" fill-opacity=".12"/>',
      '<circle cx="600" cy="400" r="360" fill="#fff" fill-opacity=".14"/><circle cx="1050" cy="120" r="180" fill="#fff" fill-opacity=".12"/>',
    ][n - 1];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset="1" stop-color="${color}" stop-opacity=".5"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/>${shapes}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };
  return { "sample:1": art(1), "sample:2": art(2), "sample:3": art(3) };
}

const photo = (n: number, caption: string) => ({ photo_path: `sample:${n}`, caption });

const SAMPLES: Record<string, BlockConfig> = {
  hero: { image_path: "sample:1" },
  hero_split: { image_path: "sample:2" },
  approach: { image_path: "sample:3" },
  image_text: { image_path: "sample:2" },
  letter: { photo_path: "sample:3" },
  testimonial: { photo_path: "sample:3" },
  banner: { image_path: "sample:1", caption: "A bright, welcoming space" },
  photos: { items: [photo(1, "Welcome to our center"), photo(2, "Play-based learning"), photo(3, "Families are part of the team")] },
  gallery: { items: [1, 2, 3, 2, 3, 1].map((n, i) => photo(n, `Photo ${i + 1}`)) },
  services_list: {
    items: [
      { title: "Early intervention", text: "Short, playful sessions in a setting your child already knows, so new skills stick.", image_path: "sample:1", link: "", link_label: "Learn more" },
      { title: "School-age therapy", text: "We work alongside teachers and families so progress shows up in the classroom too.", image_path: "sample:2", link: "", link_label: "Learn more" },
    ],
  },
  team: {
    items: [
      { name: "Jordan Lee", role: "BCBA, Clinical Director", bio: "Jordan has spent over a decade helping children and families find their voice.", photo_path: "sample:1" },
      { name: "Sam Rivera", role: "BCBA", bio: "Sam loves turning learning goals into games.", photo_path: "sample:2" },
      { name: "Alex Chen", role: "Registered Behavior Technician", bio: "", photo_path: "sample:3" },
    ],
  },
  contact_form: { embed: "https://example.com" },
  video: { video: "https://example.com" },
  map: { address: "123 Main Street, Austin, TX" },
  locations: { map: "hide" },
};

export const SAMPLE_NEWS: NewsItem[] = [
  { id: "n1", name: "We're opening a second location", story: "<p>Starting next month, we're welcoming new families at our new center on the east side.</p>", link: "https://example.com", tags: [], visible: true, published_on: "2026-09-12" },
  { id: "n2", name: "Parent workshop: building daily routines", story: "<p>Join us for a hands-on session with practical strategies you can use at home right away.</p>", link: "", tags: [], visible: true, published_on: "2026-08-28" },
  { id: "n3", name: "Meet our newest team members", story: "<p>Please say hello to three new behavior technicians who joined us this summer.</p>", link: "", tags: [], visible: true, published_on: "2026-08-05" },
];

// Buttons and links in defaults are empty (the owner supplies them), which would hide them. Preview shows them as "#".
function withSampleLinks<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withSampleLinks) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /link$/.test(k) && v === "" ? "#" : withSampleLinks(v)])) as T;
  }
  return value;
}

export function previewBlock(type: string, color: string): { block: HomeBlock; urls: Record<string, string> } | null {
  const def = blockType(type);
  if (!def) return null;
  const config = withSampleLinks({ ...(def.defaults as BlockConfig), ...SAMPLES[type] });
  return { block: { id: `preview-${type}`, type: def.type, enabled: true, config }, urls: sampleImages(color) };
}

export const PREVIEWABLE = BLOCK_TYPES.map((t) => t.type);
