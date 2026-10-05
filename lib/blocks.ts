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
export type ListSub = { key: string; label: string; kind: "text" | "textarea" | "image" | "icon" | "link"; placeholder?: string; library?: string };
export type LibraryLogo = { id: string; category: string; name: string; url: string };

type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "link"; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; max: number; fields: readonly ListSub[]; hint?: string }
  | { key: string; label: string; kind: "image"; hint?: string }
  | { key: string; label: string; kind: "richtext" }
  | { key: string; label: string; kind: "choice"; options: readonly { value: string; label: string }[] }
  | { key: string; label: string; kind: "actions" };
export type BlockField = Field;

const buttonFields: Field[] = [
  { key: "primary_label", label: "Main button text", kind: "text", placeholder: "Request an intake" },
  { key: "primary_link", label: "Main button link", kind: "link", placeholder: "https://…, tel:5551234567 or name@example.com" },
  { key: "secondary_label", label: "Second button text", kind: "text", placeholder: "Call us" },
  { key: "secondary_link", label: "Second button link", kind: "link", placeholder: "tel:5551234567" },
];

// Sections of the "Add a block" picker, in order. A block names its section with `group`.
export const BLOCK_GROUPS = [
  { key: "top", label: "Top of page" },
  { key: "trust", label: "Trust & credibility" },
  { key: "services", label: "What we do" },
  { key: "start", label: "Getting started" },
  { key: "content", label: "Content & community" },
] as const;
export type BlockGroup = (typeof BLOCK_GROUPS)[number]["key"];

export const BLOCK_TYPES = [
  {
    type: "announcement",
    group: "top",
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
    group: "top",
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
    group: "top",
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
    group: "top",
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
    group: "trust",
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
    group: "trust",
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
    group: "trust",
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
    group: "trust",
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
    group: "trust",
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
    group: "trust",
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
    type: "steps",
    group: "start",
    label: "How it works",
    hint: "Numbered steps from first contact to starting services",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Getting started is simple" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Steps", kind: "list", itemLabel: "step", max: 6, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "Contact us" }, { key: "text", label: "Description", kind: "textarea" }] },
    ],
    defaults: {
      heading: "Getting started is simple",
      subhead: "",
      items: [
        { title: "Contact us", text: "Tell us a little about your child. It takes about five minutes." },
        { title: "Intake call", text: "We'll answer your questions and check your insurance coverage." },
        { title: "Assessment", text: "We get to know your child and your goals as a family." },
        { title: "Treatment plan", text: "We build an individualized plan together and review it with you." },
        { title: "Begin services", text: "Sessions start, with regular updates on progress." },
      ],
    },
  },
  {
    type: "faq",
    group: "start",
    label: "FAQ",
    hint: "Common questions that open and close when clicked",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Frequently asked questions" },
      { key: "items", label: "Questions", kind: "list", itemLabel: "question", max: 20, fields: [{ key: "question", label: "Question", kind: "text" }, { key: "answer", label: "Answer", kind: "textarea" }] },
    ],
    defaults: {
      heading: "Frequently asked questions",
      items: [
        { question: "Does insurance cover ABA therapy?", answer: "Most plans do, including Medicaid in many states. We'll verify your benefits and explain any costs before services begin." },
        { question: "How many hours per week will my child need?", answer: "It depends on your child's needs and goals. Your assessment will recommend a schedule, and we adjust it as your child progresses." },
        { question: "What does a session look like?", answer: "Mostly play. Your child's therapist builds skills through games and activities your child enjoys, and tracks progress along the way." },
        { question: "Can I watch or take part in sessions?", answer: "Yes. Parent involvement is a big part of lasting progress, and we'll coach you along the way." },
      ],
    },
  },
  {
    type: "first_day",
    group: "start",
    label: "What to expect on day one",
    hint: "A reassuring explainer and checklist for nervous parents",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "What to expect on your first day" },
      { key: "body", label: "Text", kind: "richtext" },
      { key: "list_heading", label: "Checklist heading", kind: "text", placeholder: "What to bring" },
      { key: "items", label: "Checklist", kind: "list", itemLabel: "item", max: 10, fields: [{ key: "text", label: "Item", kind: "text" }] },
    ],
    defaults: {
      heading: "What to expect on your first day",
      body: "<p>Your first visit is a chance to get comfortable. There's no pressure and no \"test\" for your child. We'll spend time meeting each other, playing, and talking through your goals.</p><p>You're welcome to stay the whole time, and we'll answer every question you have.</p>",
      list_heading: "What to bring",
      items: [
        { text: "Your insurance card" },
        { text: "Any recent evaluations or reports" },
        { text: "Your child's favorite toy or snack" },
        { text: "Your questions" },
      ],
    },
  },
  {
    type: "availability",
    group: "start",
    label: "Availability status",
    hint: "A badge showing whether you're accepting new clients, have a waitlist, or are full",
    fields: [
      { key: "status", label: "Status", kind: "choice", options: [{ value: "accepting", label: "Accepting new clients" }, { value: "waitlist", label: "Waitlist" }, { value: "closed", label: "Not accepting" }] },
      { key: "message", label: "Message (optional)", kind: "text", placeholder: "Leave blank to use the standard wording" },
      { key: "link_label", label: "Button text", kind: "text", placeholder: "Request an intake" },
      { key: "link", label: "Button link", kind: "link" },
    ],
    defaults: { status: "accepting", message: "", link_label: "", link: "" },
  },
  {
    type: "photos",
    group: "content",
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
  {
    type: "services",
    group: "services",
    label: "Services grid",
    hint: "Cards for each service, with an icon, short description and optional link",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Our services" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Services", kind: "list", itemLabel: "service", max: 12, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "title", label: "Title", kind: "text", placeholder: "Early intervention" }, { key: "text", label: "Description", kind: "textarea" }, { key: "link", label: "Link (optional)", kind: "link" }] },
    ],
    defaults: {
      heading: "Our services",
      subhead: "Support for every stage, built around your child and your family.",
      items: [
        { icon: "baby-carriage", title: "Early intervention", text: "Play-based therapy for toddlers and preschoolers that builds communication and everyday skills.", link: "" },
        { icon: "school", title: "School-age therapy", text: "Targeted support for learning, behavior and friendships at home and at school.", link: "" },
        { icon: "users", title: "Parent training", text: "Practical coaching so the progress carries into daily routines.", link: "" },
        { icon: "friends", title: "Social skills groups", text: "Small groups where children practice connecting with peers.", link: "" },
        { icon: "clipboard-check", title: "Assessment", text: "A thorough, family-centered evaluation to shape the right plan.", link: "" },
      ],
    },
  },
  {
    type: "services_list",
    group: "services",
    label: "Services with photos",
    hint: "Alternating photo and text rows for a deeper look at each service",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "How we help" },
      { key: "items", label: "Services", kind: "list", itemLabel: "service", max: 8, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "Early intervention" }, { key: "text", label: "Description", kind: "textarea" }, { key: "image", label: "Photo", kind: "image" }, { key: "link", label: "Link (optional)", kind: "link" }, { key: "link_label", label: "Link text", kind: "text", placeholder: "Learn more" }] },
    ],
    defaults: {
      heading: "How we help",
      items: [
        { title: "Early intervention", text: "Short, playful sessions in a setting your child already knows, so new skills stick.", link: "", link_label: "Learn more" },
        { title: "School-age therapy", text: "We work alongside teachers and families so progress shows up in the classroom too.", link: "", link_label: "Learn more" },
      ],
    },
  },
  {
    type: "settings",
    group: "services",
    label: "Where we provide care",
    hint: "In-home, center-based, school-based and telehealth, each with a short description",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Care where your child is comfortable" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Settings", kind: "list", itemLabel: "setting", max: 6, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "name", label: "Name", kind: "text", placeholder: "In-home" }, { key: "text", label: "Description", kind: "textarea" }] },
    ],
    defaults: {
      heading: "Care where your child is comfortable",
      subhead: "",
      items: [
        { icon: "home", name: "In-home", text: "Therapy in your own space, working on the routines that matter most to your family." },
        { icon: "building", name: "Center-based", text: "A purpose-built space with peers, play areas and everything our team needs." },
        { icon: "school", name: "School-based", text: "Support in the classroom, coordinated with teachers and staff." },
        { icon: "video", name: "Telehealth", text: "Parent coaching and sessions by video, wherever you are." },
      ],
    },
  },
  {
    type: "ages",
    group: "services",
    label: "Age groups served",
    hint: "Toddlers, children, teens and adults, with the ages each covers",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Who we serve" },
      { key: "items", label: "Age groups", kind: "list", itemLabel: "group", max: 6, fields: [{ key: "range", label: "Ages", kind: "text", placeholder: "Ages 1–3" }, { key: "label", label: "Name", kind: "text", placeholder: "Toddlers" }, { key: "text", label: "Short description (optional)", kind: "textarea" }] },
    ],
    defaults: {
      heading: "Who we serve",
      items: [
        { range: "Ages 1–3", label: "Toddlers", text: "Early support for communication and play." },
        { range: "Ages 4–12", label: "Children", text: "Skills for learning, behavior and friendships." },
        { range: "Ages 13–17", label: "Teens", text: "Independence, social skills and school success." },
        { range: "18+", label: "Adults", text: "Daily living and community skills." },
      ],
    },
  },
  {
    type: "approach",
    group: "services",
    label: "Our approach",
    hint: "Your philosophy, written out, with an optional photo beside it",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Our approach" },
      { key: "body", label: "Text", kind: "richtext" },
      { key: "image", label: "Photo (optional)", kind: "image" },
      { key: "image_side", label: "Photo position", kind: "choice", options: [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] },
    ],
    defaults: {
      heading: "Our approach",
      body: "<p>Every child learns differently. We start by getting to know your child and your family, then build a plan around what matters most to you.</p><p>Our sessions are play-based and led by what motivates your child, so learning feels like fun.</p>",
      image_side: "right",
    },
  },
  {
    type: "values",
    group: "services",
    label: "Our values",
    hint: "Three to six icon tiles, each with a word and a sentence",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "What we stand for" },
      { key: "items", label: "Values", kind: "list", itemLabel: "value", max: 6, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "title", label: "Word or phrase", kind: "text", placeholder: "Compassion" }, { key: "text", label: "One sentence", kind: "textarea" }] },
    ],
    defaults: {
      heading: "What we stand for",
      items: [
        { icon: "heart", title: "Compassion", text: "Every child and family is met with kindness and patience." },
        { icon: "users", title: "Partnership", text: "Parents are part of the team, always." },
        { icon: "bulb", title: "Evidence-based", text: "We use methods backed by research and update them as the science does." },
        { icon: "shield-check", title: "Integrity", text: "Honest communication and ethical care at every step." },
      ],
    },
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

// Standard wording and colors for the availability badge.
export const AVAILABILITY = {
  accepting: { text: "Currently accepting new clients", dot: "#16a34a", tint: "#f0fdf4", ring: "#bbf7d0" },
  waitlist: { text: "Waitlist open: join to reserve a spot", dot: "#d97706", tint: "#fffbeb", ring: "#fde68a" },
  closed: { text: "Not accepting new clients right now", dot: "#6b7280", tint: "#f9fafb", ring: "#e5e7eb" },
} as const;

// A short line for the dashboard list.
export function blockSummary(type: string, c: BlockConfig) {
  if (type === "announcement") return configText(c, "text");
  if (type === "testimonial") return configText(c, "quote");
  if (type === "stats") return configList(c).map((i) => `${i.value ?? ""} ${i.label ?? ""}`.trim()).join(" · ");
  if (["insurance", "credentials"].includes(type)) return configList(c).map((i) => i.name).filter(Boolean).join(" · ");
  if (["testimonials", "outcomes"].includes(type)) return configText(c, "heading");
  if (type === "photos") return configText(c, "heading") || `${configList(c).filter((i) => i.photo_path).length} photos`;
  if (type === "quick_actions") return configItems(c).filter((i) => i.label).map((i) => i.label).join(" · ");
  if (type === "approach" || type === "first_day") return configText(c, "heading");
  if (type === "faq") return configList(c).map((i) => i.question).filter(Boolean).join(" · ");
  if (type === "availability") return configText(c, "message") || AVAILABILITY[configText(c, "status") as keyof typeof AVAILABILITY]?.text || "";
  if (["services", "services_list", "settings", "ages", "values", "steps"].includes(type)) {
    return configList(c).map((i) => i.title || i.name || i.label).filter(Boolean).join(" · ");
  }
  return configText(c, "headline");
}
