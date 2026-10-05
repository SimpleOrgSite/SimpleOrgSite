import { ICON_LIBRARY } from "@/components/icon-library";

// Safe to import from client components (no server code).
// A block's settings are described as data: the editor form, the server-side validation and the
// dashboard summary all read from BLOCK_TYPES, so a new block type is mostly one entry here plus a renderer.

export type ActionItem = { icon: string; label: string; link: string };
export type BlockConfig = Record<string, unknown>;
export type HomeBlock = { id: string; type: BlockType; enabled: boolean; config: BlockConfig };

// Icon names are stored as plain strings; anything not in the library is dropped to "" (no icon).
export const iconName = (v: unknown) => (typeof v === "string" && Object.hasOwn(ICON_LIBRARY, v) ? v : "");
export const MAX_ACTIONS = 4;

// One repeatable row inside a "list" field. An image sub-field "logo" is stored as "logo_path".
// "library" on an image sub-field names a logo_library category the owner can pick from instead of uploading.
export type ListSub = { key: string; label: string; kind: "text" | "textarea" | "image" | "icon"; placeholder?: string; library?: string };
export type LibraryLogo = { id: string; category: string; name: string; url: string };

type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "link"; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; max: number; fields: readonly ListSub[]; hint?: string }
  | { key: string; label: string; kind: "image"; hint?: string }
  | { key: string; label: string; kind: "choice"; options: readonly { value: string; label: string }[] }
  | { key: string; label: string; kind: "actions" };
export type BlockField = Field;

const buttonFields: Field[] = [
  { key: "primary_label", label: "Main button text", kind: "text", placeholder: "Request an intake" },
  { key: "primary_link", label: "Main button link", kind: "link", placeholder: "https://…, tel:5551234567 or name@example.com" },
  { key: "secondary_label", label: "Second button text", kind: "text", placeholder: "Call us" },
  { key: "secondary_link", label: "Second button link", kind: "link", placeholder: "tel:5551234567" },
];

export const BLOCK_TYPES = [
  {
    type: "announcement",
    label: "Announcement bar",
    hint: "A thin strip above the header on every page, e.g. “Now accepting new clients”",
    fields: [
      { key: "text", label: "Message", kind: "text", placeholder: "Now accepting new clients in Travis County" },
      { key: "link_label", label: "Link text", kind: "text", placeholder: "Learn more" },
      { key: "link", label: "Link", kind: "link", placeholder: "https://…" },
      { key: "style", label: "Style", kind: "choice", options: [{ value: "theme", label: "Theme color" }, { value: "light", label: "Soft tint" }] },
    ],
    defaults: { text: "Now accepting new clients", link_label: "Learn more", link: "", style: "theme" },
  },
  {
    type: "hero",
    label: "Hero with background image",
    hint: "Big headline and buttons over a full-width photo",
    fields: [
      { key: "headline", label: "Headline", kind: "text", placeholder: "Compassionate ABA therapy for your child" },
      { key: "subhead", label: "Subheading", kind: "textarea" },
      { key: "image", label: "Background image", kind: "image", hint: "Optional. Without one, the background is your theme color." },
      { key: "align", label: "Text alignment", kind: "choice", options: [{ value: "center", label: "Centered" }, { value: "left", label: "Left" }] },
      ...buttonFields,
    ],
    defaults: { headline: "Compassionate ABA therapy for your child", subhead: "Individualized, play-based support that helps children and families thrive.", align: "center", primary_label: "Request an intake", primary_link: "", secondary_label: "", secondary_link: "" },
  },
  {
    type: "hero_split",
    label: "Hero with photo beside it",
    hint: "Headline and buttons on one side, a photo on the other",
    fields: [
      { key: "headline", label: "Headline", kind: "text", placeholder: "Compassionate ABA therapy for your child" },
      { key: "subhead", label: "Subheading", kind: "textarea" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "image_side", label: "Photo position", kind: "choice", options: [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] },
      ...buttonFields,
    ],
    defaults: { headline: "Compassionate ABA therapy for your child", subhead: "Individualized, play-based support that helps children and families thrive.", image_side: "right", primary_label: "Request an intake", primary_link: "", secondary_label: "", secondary_link: "" },
  },
  {
    type: "quick_actions",
    label: "Quick-action buttons",
    hint: "Up to four icon buttons, like Get Started, Insurance, Careers",
    fields: [{ key: "items", label: "Buttons", kind: "actions" }],
    defaults: {
      items: [
        { icon: "clipboard-check", label: "Get started", link: "" },
        { icon: "shield-check", label: "Insurance", link: "" },
        { icon: "book", label: "Parent resources", link: "" },
        { icon: "briefcase", label: "Careers", link: "" },
      ] satisfies ActionItem[],
    },
  },
  {
    type: "insurance",
    label: "Insurance & funding",
    hint: "Logos of accepted plans as a grid or a never-ending scrolling row, with a “verify my coverage” button",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Insurance we accept" },
      { key: "subhead", label: "Subheading", kind: "text", placeholder: "We work with most major plans, including Medicaid." },
      { key: "layout", label: "Layout", kind: "choice", options: [{ value: "grid", label: "Grid of logos" }, { value: "scroll", label: "Scrolling row (never ends)" }] },
      { key: "items", label: "Plans", kind: "list", itemLabel: "plan", max: 16, hint: "Add a logo, or just a name to show as text.", fields: [{ key: "name", label: "Plan name", kind: "text", placeholder: "Aetna" }, { key: "logo", label: "Logo", kind: "image", library: "insurance" }] },
      { key: "link_label", label: "Button text", kind: "text", placeholder: "Verify my coverage" },
      { key: "link", label: "Button link", kind: "link", placeholder: "https://… or tel:5551234567" },
    ],
    defaults: { heading: "Insurance we accept", layout: "grid", subhead: "We work with most major plans, including Medicaid.", items: [{ name: "Medicaid" }, { name: "Aetna" }, { name: "Blue Cross Blue Shield" }, { name: "Cigna" }], link_label: "Verify my coverage", link: "" },
  },
  {
    type: "credentials",
    label: "Credentials & accreditations",
    hint: "Badges for licensure, certifications and memberships",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Licensed, certified, accredited" },
      { key: "items", label: "Badges", kind: "list", itemLabel: "badge", max: 12, fields: [{ key: "name", label: "Name", kind: "text", placeholder: "BACB Certified" }, { key: "logo", label: "Badge image", kind: "image", library: "credentials" }] },
    ],
    defaults: { heading: "Licensed, certified, accredited", items: [{ name: "BACB certified supervisors" }, { name: "HIPAA compliant" }, { name: "State licensed" }] },
  },
  {
    type: "stats",
    label: "Stats row",
    hint: "Big numbers like “400+ children served”",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text" },
      { key: "style", label: "Style", kind: "choice", options: [{ value: "dark", label: "Dark (theme color background)" }, { value: "light", label: "Light (white background)" }] },
      { key: "items", label: "Stats", kind: "list", itemLabel: "stat", max: 6, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "value", label: "Number", kind: "text", placeholder: "400+" }, { key: "label", label: "Label", kind: "text", placeholder: "Children served" }] },
    ],
    defaults: { heading: "", style: "dark", items: [{ value: "12", label: "Years serving families" }, { value: "400+", label: "Children served" }, { value: "98%", label: "Parent satisfaction" }] },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    hint: "Several parent quotes, as a grid or a swipeable row",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "What parents say" },
      { key: "layout", label: "Layout", kind: "choice", options: [{ value: "grid", label: "Grid" }, { value: "scroll", label: "Swipeable row" }] },
      { key: "items", label: "Quotes", kind: "list", itemLabel: "quote", max: 12, fields: [{ key: "quote", label: "Quote", kind: "textarea" }, { key: "name", label: "Name", kind: "text", placeholder: "Maria, mom of Leo" }, { key: "photo", label: "Photo (optional)", kind: "image" }] },
    ],
    defaults: { heading: "What parents say", layout: "grid", items: [{ quote: "Our son is communicating in ways we never thought possible. The team feels like family.", name: "Parent of a 5-year-old" }, { quote: "They listened to us first, then built a plan around our child and our routines.", name: "Parent of a 3-year-old" }, { quote: "Every session is joyful. He runs to the door when they arrive.", name: "Parent of a 4-year-old" }] },
  },
  {
    type: "testimonial",
    label: "Featured testimonial",
    hint: "One large pull quote",
    fields: [
      { key: "quote", label: "Quote", kind: "textarea" },
      { key: "name", label: "Name", kind: "text", placeholder: "Maria, mom of Leo" },
      { key: "photo", label: "Photo (optional)", kind: "image" },
    ],
    defaults: { quote: "Our son is communicating in ways we never thought possible. The team feels like family.", name: "Parent of a 5-year-old" },
  },
  {
    type: "outcomes",
    label: "Outcomes & success stories",
    hint: "Short, anonymized results that show what progress looks like",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Progress families see" },
      { key: "items", label: "Stories", kind: "list", itemLabel: "story", max: 6, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "From 5 words to full sentences" }, { key: "text", label: "Story", kind: "textarea" }] },
      { key: "note", label: "Small print", kind: "text", placeholder: "Details changed to protect privacy." },
    ],
    defaults: { heading: "Progress families see", items: [{ title: "From a few words to full sentences", text: "Within a year of starting, a 4-year-old went from using a handful of words to telling his parents about his day." }, { title: "Calmer mornings", text: "A family worked with their team on a visual routine, and school drop-off tantrums dropped from daily to rare." }], note: "Details changed to protect privacy. Every child's progress is different." },
  },
  {
    type: "photos",
    label: "Photo carousel",
    hint: "Large photos shown one at a time, sliding automatically",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text", placeholder: "Inside our center" },
      { key: "seconds", label: "Seconds per photo", kind: "choice", options: [{ value: "4", label: "4" }, { value: "6", label: "6" }, { value: "8", label: "8" }, { value: "10", label: "10" }] },
      { key: "arrows", label: "Previous / next buttons", kind: "choice", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
      { key: "items", label: "Photos", kind: "list", itemLabel: "photo", max: 12, hint: "Landscape photos work best. They're shown wide, and cropped to fit.", fields: [{ key: "photo", label: "Photo", kind: "image" }, { key: "caption", label: "Caption (optional)", kind: "text" }] },
    ],
    defaults: { heading: "", seconds: "6", arrows: "show", items: [] },
  },
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["type"];
export const blockType = (type: string) => BLOCK_TYPES.find((t) => t.type === type);

export const configText = (c: BlockConfig, key: string) => (typeof c[key] === "string" ? (c[key] as string) : "");
// Items of a "list" field (stats, testimonials, …): plain objects of strings, with image paths as "<key>_path".
export const configList = (c: BlockConfig, key = "items"): Record<string, string>[] => (Array.isArray(c[key]) ? (c[key] as Record<string, string>[]) : []);
export const configItems = (c: BlockConfig): ActionItem[] => (Array.isArray(c.items) ? (c.items as ActionItem[]) : []);

// "" for none, null for something unusable. Unlike news links, buttons here may also be phone/email
// links and pages on the site itself ("/about", "#faq"). Anything else (javascript: etc.) is rejected.
export function normalizeBlockLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  if (/^(\/|#)/.test(v) && !v.startsWith("//")) return v;
  if (/^tel:[+0-9().\-\s]+$/i.test(v)) return v.replace(/\s+/g, "");
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(v)) return v;
  if (/^[+0-9().\-\s]{7,}$/.test(v)) return `tel:${v.replace(/[^+0-9]/g, "")}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Every uploaded image path in a config, top level or inside list rows. Used to look up URLs and to clean up files no longer used.
export function collectImagePaths(c: BlockConfig): string[] {
  const out: string[] = [];
  const scan = (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) {
      if (k.endsWith("_path") && typeof v === "string" && v) out.push(v);
      else if (Array.isArray(v)) for (const row of v) if (row && typeof row === "object") scan(row as Record<string, unknown>);
    }
  };
  scan(c);
  return out;
}

// Ids of shared-library logos a block uses, stored in list rows as "<key>_lib". Not files the owner holds, so never cleaned up.
export function collectLibraryIds(c: BlockConfig): string[] {
  const out: string[] = [];
  for (const v of Object.values(c)) {
    if (!Array.isArray(v)) continue;
    for (const row of v) if (row && typeof row === "object") for (const [k, id] of Object.entries(row)) if (k.endsWith("_lib") && typeof id === "string" && id) out.push(id);
  }
  return out;
}

// The key renderers use to look up a library logo's URL in the same path-to-URL map as uploads.
export const libraryKey = (id: string | undefined) => (id ? `lib:${id}` : "");

// A short line for the dashboard list.
export function blockSummary(type: string, c: BlockConfig) {
  if (type === "announcement") return configText(c, "text");
  if (type === "testimonial") return configText(c, "quote");
  if (type === "stats") return configList(c).map((i) => `${i.value ?? ""} ${i.label ?? ""}`.trim()).join(" · ");
  if (["insurance", "credentials"].includes(type)) return configList(c).map((i) => i.name).filter(Boolean).join(" · ");
  if (["testimonials", "outcomes"].includes(type)) return configText(c, "heading");
  if (type === "photos") return configText(c, "heading") || `${configList(c).filter((i) => i.photo_path).length} photos`;
  if (type === "quick_actions") return configItems(c).filter((i) => i.label).map((i) => i.label).join(" · ");
  return configText(c, "headline");
}
