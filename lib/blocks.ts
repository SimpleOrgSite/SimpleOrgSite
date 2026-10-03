import type { IconName } from "@/components/icons";

// Safe to import from client components (no server code).
// A block's settings are described as data: the editor form, the server-side validation and the
// dashboard summary all read from BLOCK_TYPES, so a new block type is mostly one entry here plus a renderer.

export type ActionItem = { icon: IconName; label: string; link: string };
export type BlockConfig = Record<string, unknown>;
export type HomeBlock = { id: string; type: BlockType; enabled: boolean; config: BlockConfig };

export const ACTION_ICONS = ["phone", "mail", "calendar-event", "clipboard-check", "shield-check", "heart-handshake", "users", "book", "briefcase", "file-text", "map-pin", "home", "star", "message-circle", "school", "puzzle", "heart"] as const satisfies readonly IconName[];
export const MAX_ACTIONS = 4;

type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "link"; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: "image"; hint?: string }
  | { key: string; label: string; kind: "choice"; options: readonly { value: string; label: string }[] }
  | { key: string; label: string; kind: "actions" };
export type BlockField = Field;

const buttonFields: Field[] = [
  { key: "primary_label", label: "Main button text", kind: "text", placeholder: "Request an intake" },
  { key: "primary_link", label: "Main button link", kind: "link", placeholder: "/contact, tel:5551234567, or https://…" },
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
      { key: "link", label: "Link", kind: "link", placeholder: "https://… (optional)" },
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
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["type"];
export const blockType = (type: string) => BLOCK_TYPES.find((t) => t.type === type);

export const configText = (c: BlockConfig, key: string) => (typeof c[key] === "string" ? (c[key] as string) : "");
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

// A short line for the dashboard list.
export function blockSummary(type: string, c: BlockConfig) {
  if (type === "announcement") return configText(c, "text");
  if (type === "quick_actions") return configItems(c).filter((i) => i.label).map((i) => i.label).join(" · ");
  return configText(c, "headline");
}
