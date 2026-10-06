import { PHOTO_SHAPES } from "@/lib/directors";
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
export type ListSub = { key: string; label: string; kind: "text" | "textarea" | "image" | "icon" | "link" | "file"; placeholder?: string; library?: string };
export type LibraryLogo = { id: string; category: string; name: string; url: string };

type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "link"; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; max: number; fields: readonly ListSub[]; hint?: string }
  | { key: string; label: string; kind: "image"; hint?: string }
  | { key: string; label: string; kind: "richtext" }
  | { key: string; label: string; kind: "embed"; hint?: string }
  | { key: string; label: string; kind: "video"; hint?: string }
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
  { key: "people", label: "People" },
  { key: "locations", label: "Locations & contact" },
  { key: "content", label: "Content & community" },
  { key: "utility", label: "Free-form" },
  { key: "notices", label: "Notices & safety" },
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
    type: "team",
    group: "people",
    label: "Team grid",
    hint: "Photo, name, credentials and a short bio for each person",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Meet our team" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "shape", label: "Photo shape", kind: "choice", options: PHOTO_SHAPES.map((s) => ({ value: s.key, label: s.label })) },
      { key: "items", label: "People", kind: "list", itemLabel: "person", max: 24, fields: [{ key: "photo", label: "Photo", kind: "image" }, { key: "name", label: "Name", kind: "text", placeholder: "Jordan Lee" }, { key: "role", label: "Title / credentials", kind: "text", placeholder: "BCBA, Clinical Director" }, { key: "bio", label: "Short bio (optional)", kind: "textarea" }] },
    ],
    defaults: { heading: "Meet our team", subhead: "", shape: "circle", items: [{ name: "Jordan Lee", role: "BCBA, Clinical Director", bio: "Jordan has spent over a decade helping children and families find their voice." }, { name: "Sam Rivera", role: "BCBA", bio: "Sam loves turning learning goals into games." }, { name: "Alex Chen", role: "Registered Behavior Technician", bio: "" }] },
  },
  {
    type: "letter",
    group: "people",
    label: "Welcome letter",
    hint: "A personal note from the founder or director, with photo and signature",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "A note from our founder" },
      { key: "body", label: "Letter", kind: "richtext" },
      { key: "name", label: "Name", kind: "text", placeholder: "Jordan Lee" },
      { key: "title", label: "Title", kind: "text", placeholder: "Founder & Clinical Director" },
      { key: "signature", label: "Handwritten signature", kind: "choice", options: [{ value: "show", label: "Show" }, { value: "hide", label: "Hide" }] },
      { key: "photo", label: "Photo (optional)", kind: "image" },
    ],
    defaults: { heading: "A note from our founder", body: "<p>Welcome, and thank you for considering us.</p><p>I started this practice because every child deserves to be understood, and every family deserves support they can count on. Our team treats your child the way we would want our own children treated: with patience, joy and respect.</p><p>I hope we get the chance to meet you.</p>", name: "Jordan Lee", title: "Founder & Clinical Director", signature: "show" },
  },
  {
    type: "careers",
    group: "people",
    label: "Careers callout",
    hint: "A “join our team” banner with an apply button",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Join our team" },
      { key: "text", label: "Text", kind: "textarea" },
      { key: "link_label", label: "Button text", kind: "text", placeholder: "See open positions" },
      { key: "link", label: "Button link", kind: "link" },
      { key: "style", label: "Style", kind: "choice", options: [{ value: "dark", label: "Dark (theme color background)" }, { value: "light", label: "Light (tinted background)" }] },
    ],
    defaults: { heading: "Join our team", text: "We're always looking for kind, curious people who want to make a real difference for children and families.", link_label: "See open positions", link: "", style: "dark" },
  },
  {
    type: "positions",
    group: "people",
    label: "Open positions",
    hint: "A list of jobs with location, type and an apply link",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Open positions" },
      { key: "intro", label: "Intro (optional)", kind: "text" },
      { key: "items", label: "Positions", kind: "list", itemLabel: "position", max: 20, fields: [{ key: "title", label: "Job title", kind: "text", placeholder: "Registered Behavior Technician" }, { key: "location", label: "Location", kind: "text", placeholder: "Austin, TX" }, { key: "kind", label: "Type", kind: "text", placeholder: "Full-time" }, { key: "link", label: "Apply link", kind: "link" }] },
      { key: "empty_text", label: "Message when there are no positions", kind: "text", placeholder: "No openings right now. Email us to be considered for the future." },
    ],
    defaults: { heading: "Open positions", intro: "", items: [{ title: "Registered Behavior Technician (RBT)", location: "Austin, TX", kind: "Full-time", link: "" }, { title: "Board Certified Behavior Analyst (BCBA)", location: "Austin, TX", kind: "Full-time", link: "" }], empty_text: "No openings right now. Check back soon." },
  },
  {
    type: "locations",
    group: "locations",
    label: "Locations & service areas",
    hint: "Addresses, hours, phone and a map, plus the cities or counties you serve",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Find us" },
      { key: "map", label: "Map", kind: "choice", options: [{ value: "show", label: "Show a map for each location" }, { value: "hide", label: "No map" }] },
      { key: "items", label: "Locations", kind: "list", itemLabel: "location", max: 6, fields: [{ key: "name", label: "Name", kind: "text", placeholder: "Main office" }, { key: "address", label: "Address", kind: "textarea" }, { key: "phone", label: "Phone", kind: "text", placeholder: "(555) 123-4567" }, { key: "hours", label: "Hours", kind: "textarea", placeholder: "Mon–Fri 8am–6pm" }] },
      { key: "areas_heading", label: "Service areas heading", kind: "text", placeholder: "Areas we serve" },
      { key: "areas", label: "Cities or counties served", kind: "textarea", hint: "One per line, or separated by commas." },
    ],
    defaults: { heading: "Find us", map: "show", items: [{ name: "Main office", address: "123 Main Street\nAustin, TX 78701", phone: "", hours: "Monday–Friday, 8am–6pm" }], areas_heading: "Areas we serve", areas: "Travis County\nWilliamson County\nHays County" },
  },
  {
    type: "contact_form",
    group: "locations",
    label: "Contact / intake form",
    hint: "Your own form from Jotform, Google Forms, Typeform or similar, embedded on the page",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Request an intake" },
      { key: "intro", label: "Intro (optional)", kind: "text", placeholder: "Tell us a little about your child and we'll be in touch." },
      { key: "embed", label: "Form embed code or link", kind: "embed", hint: "In your form provider, choose Share or Embed and paste the embed code or the link here. Answers go straight to your provider. We never see or store them." },
      { key: "height", label: "Form height", kind: "choice", options: [{ value: "500", label: "Short" }, { value: "700", label: "Medium" }, { value: "900", label: "Tall" }, { value: "1200", label: "Extra tall" }] },
    ],
    defaults: { heading: "Request an intake", intro: "", embed: "", height: "700" },
  },
  {
    type: "contact_info",
    group: "locations",
    label: "Contact info bar",
    hint: "Phone, email, address and hours in one strip, all click to call or open",
    fields: [
      { key: "phone", label: "Phone", kind: "text", placeholder: "(555) 123-4567" },
      { key: "email", label: "Email", kind: "text", placeholder: "hello@yourpractice.com" },
      { key: "address", label: "Address", kind: "text", placeholder: "123 Main Street, Austin, TX 78701" },
      { key: "hours", label: "Hours", kind: "text", placeholder: "Mon–Fri, 8am–6pm" },
      { key: "style", label: "Style", kind: "choice", options: [{ value: "light", label: "Light (tinted background)" }, { value: "dark", label: "Dark (theme color background)" }] },
    ],
    defaults: { phone: "", email: "", address: "", hours: "Mon–Fri, 8am–6pm", style: "light" },
  },
  {
    type: "cta",
    group: "locations",
    label: "Call-to-action banner",
    hint: "A full-width color band like “Ready to get started?” with buttons",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Ready to get started?" },
      { key: "text", label: "Text", kind: "textarea" },
      ...buttonFields,
      { key: "style", label: "Style", kind: "choice", options: [{ value: "dark", label: "Dark (theme color background)" }, { value: "light", label: "Light (tinted background)" }] },
    ],
    defaults: { heading: "Ready to get started?", text: "Reach out today. We'll answer your questions and walk you through the next steps.", primary_label: "Request an intake", primary_link: "", secondary_label: "", secondary_link: "", style: "dark" },
  },
  {
    type: "news_feed",
    group: "content",
    label: "Latest news",
    hint: "Your most recent stories from the News page, with a link to see them all",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Latest news" },
      { key: "count", label: "How many stories", kind: "choice", options: [{ value: "3", label: "3" }, { value: "6", label: "6" }, { value: "9", label: "9" }] },
    ],
    defaults: { heading: "Latest news", count: "3" },
  },
  {
    type: "resources",
    group: "content",
    label: "Resources",
    hint: "A list of helpful guides and links for parents, with uploaded PDFs or links",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Resources for parents" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Resources", kind: "list", itemLabel: "resource", max: 20, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "Visual schedule starter kit" }, { key: "tag", label: "Label (optional)", kind: "text", placeholder: "PDF" }, { key: "text", label: "Description", kind: "textarea" }, { key: "doc", label: "Upload a file (PDF or Word)", kind: "file" }, { key: "link", label: "Or link to a file or page", kind: "link" }] },
    ],
    defaults: { heading: "Resources for parents", subhead: "", items: [{ title: "Visual schedule starter kit", tag: "PDF", text: "Printable cards to help your child follow daily routines.", link: "" }, { title: "ABA glossary for families", tag: "Guide", text: "Plain-language explanations of the words you'll hear.", link: "" }] },
  },
  {
    type: "workshops",
    group: "content",
    label: "Workshops & parent training",
    hint: "Upcoming sessions as a simple list with dates written out",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Upcoming workshops" },
      { key: "intro", label: "Intro (optional)", kind: "text" },
      { key: "items", label: "Sessions", kind: "list", itemLabel: "session", max: 12, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "Introduction to toilet training" }, { key: "when", label: "Date and time", kind: "text", placeholder: "Saturday, Nov 8 · 10am" }, { key: "where", label: "Where", kind: "text", placeholder: "Main office, or online" }, { key: "text", label: "Description", kind: "textarea" }, { key: "link", label: "Sign-up link (optional)", kind: "link" }] },
      { key: "empty_text", label: "Message when there are none", kind: "text", placeholder: "No workshops scheduled right now. Check back soon." },
    ],
    defaults: { heading: "Upcoming workshops", intro: "", items: [{ title: "Parent training: building daily routines", when: "Saturday, 10am", where: "Main office", text: "Practical strategies you can use at home right away.", link: "" }], empty_text: "No workshops scheduled right now. Check back soon." },
  },
  {
    type: "video",
    group: "content",
    label: "Video",
    hint: "A YouTube or Vimeo video, such as a welcome message or tour",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Take a tour" },
      { key: "intro", label: "Intro (optional)", kind: "text" },
      { key: "video", label: "Video link", kind: "video", hint: "Paste a YouTube or Vimeo link." },
    ],
    defaults: { heading: "Take a tour", intro: "", video: "" },
  },
  {
    type: "gallery",
    group: "content",
    label: "Photo gallery",
    hint: "A grid of photos that open larger when clicked",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Inside our center" },
      { key: "columns", label: "Photos per row", kind: "choice", options: [{ value: "3", label: "3" }, { value: "4", label: "4" }] },
      { key: "items", label: "Photos", kind: "list", itemLabel: "photo", max: 24, fields: [{ key: "photo", label: "Photo", kind: "image" }, { key: "caption", label: "Caption (optional)", kind: "text" }] },
    ],
    defaults: { heading: "", columns: "3", items: [] },
  },
  {
    type: "partners",
    group: "trust",
    label: "Community partners",
    hint: "Logos of schools, pediatricians and nonprofits you work with, as a grid or scrolling row",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Our community partners" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "layout", label: "Layout", kind: "choice", options: [{ value: "grid", label: "Grid of logos" }, { value: "scroll", label: "Scrolling row (never ends)" }] },
      { key: "items", label: "Partners", kind: "list", itemLabel: "partner", max: 20, hint: "Add a logo, or just a name to show as text.", fields: [{ key: "name", label: "Name", kind: "text" }, { key: "logo", label: "Logo", kind: "image", library: "partners" }] },
    ],
    defaults: { heading: "Our community partners", subhead: "", layout: "grid", items: [{ name: "Local school district" }, { name: "Children's hospital" }, { name: "Autism society chapter" }] },
  },
  {
    type: "glossary",
    group: "content",
    label: "Glossary",
    hint: "ABA terms explained in plain language",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "ABA terms, in plain language" },
      { key: "intro", label: "Intro (optional)", kind: "text" },
      { key: "sort", label: "Order", kind: "choice", options: [{ value: "alpha", label: "A to Z" }, { value: "mine", label: "My order" }] },
      { key: "items", label: "Terms", kind: "list", itemLabel: "term", max: 40, fields: [{ key: "term", label: "Term", kind: "text", placeholder: "Reinforcement" }, { key: "definition", label: "Plain-language meaning", kind: "textarea" }] },
    ],
    defaults: { heading: "ABA terms, in plain language", intro: "", sort: "alpha", items: [{ term: "BCBA", definition: "Board Certified Behavior Analyst: the clinician who designs and oversees your child's plan." }, { term: "RBT", definition: "Registered Behavior Technician: the trained team member who works directly with your child." }, { term: "Reinforcement", definition: "Something that follows a behavior and makes it more likely to happen again, like praise or a favorite toy." }] },
  },
  {
    type: "rich_text",
    group: "utility",
    label: "Free text",
    hint: "A heading and formatted text, for anything that doesn't fit another block",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text" },
      { key: "body", label: "Text", kind: "richtext" },
      { key: "align", label: "Alignment", kind: "choice", options: [{ value: "left", label: "Left" }, { value: "center", label: "Centered" }] },
      { key: "background", label: "Background", kind: "choice", options: [{ value: "white", label: "White" }, { value: "tint", label: "Soft gray" }] },
    ],
    defaults: { heading: "", body: "<p>Write anything here.</p>", align: "left", background: "white" },
  },
  {
    type: "image_text",
    group: "utility",
    label: "Image and text",
    hint: "A photo beside a heading, text and an optional button",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Text", kind: "richtext" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "image_side", label: "Photo position", kind: "choice", options: [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] },
      { key: "primary_label", label: "Button text (optional)", kind: "text" },
      { key: "primary_link", label: "Button link", kind: "link" },
    ],
    defaults: { heading: "Tell your story", body: "<p>Share something about your practice here.</p>", image_side: "right", primary_label: "", primary_link: "" },
  },
  {
    type: "compliance",
    group: "notices",
    label: "Compliance notices",
    hint: "Privacy, non-discrimination and billing notices, in small print",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Notices" },
      { key: "items", label: "Notices", kind: "list", itemLabel: "notice", max: 8, hint: "Use the wording your practice is required to display. Have your attorney or compliance lead review it.", fields: [{ key: "title", label: "Title", kind: "text", placeholder: "Notice of privacy practices" }, { key: "text", label: "Text", kind: "textarea" }, { key: "link", label: "Link to the full notice (optional)", kind: "link" }] },
    ],
    defaults: { heading: "Notices", items: [{ title: "Notice of privacy practices", text: "Replace this with your practice's privacy notice or a short summary.", link: "" }, { title: "Non-discrimination", text: "Replace this with your practice's non-discrimination statement.", link: "" }, { title: "Billing and your rights", text: "Replace this with your billing and good-faith estimate information.", link: "" }] },
  },
  {
    type: "crisis",
    group: "notices",
    label: "Crisis & emergency resources",
    hint: "988, 911 and other emergency contacts, with call links",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "If you need help right now" },
      { key: "intro", label: "Intro (optional)", kind: "text" },
      { key: "items", label: "Resources", kind: "list", itemLabel: "resource", max: 6, fields: [{ key: "name", label: "Name", kind: "text", placeholder: "988 Suicide & Crisis Lifeline" }, { key: "phone", label: "Phone number (makes a call link)", kind: "text", placeholder: "988" }, { key: "text", label: "Details", kind: "textarea" }, { key: "link", label: "Website (optional)", kind: "link" }] },
    ],
    defaults: { heading: "If you need help right now", intro: "We're not an emergency service. If someone is in danger, please use one of these.", items: [{ name: "Emergency", phone: "911", text: "If someone is in immediate danger.", link: "" }, { name: "988 Suicide & Crisis Lifeline", phone: "988", text: "Call or text, any time, free and confidential.", link: "https://988lifeline.org" }, { name: "Crisis Text Line", phone: "", text: "Text HOME to 741741 to reach a trained crisis counselor.", link: "https://www.crisistextline.org" }, { name: "Poison Control", phone: "1-800-222-1222", text: "Free, expert help 24 hours a day.", link: "" }] },
  },
  {
    type: "reviews",
    group: "trust",
    label: "Reviews badge",
    hint: "Your star rating and review count, with a link to your reviews (entered by hand)",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text", placeholder: "Families love us" },
      { key: "rating", label: "Rating out of 5", kind: "text", placeholder: "4.9" },
      { key: "count", label: "Number of reviews", kind: "text", placeholder: "120" },
      { key: "source", label: "Where the reviews are", kind: "text", placeholder: "Google" },
      { key: "link_label", label: "Link text", kind: "text", placeholder: "Read our reviews" },
      { key: "link", label: "Link", kind: "link" },
    ],
    defaults: { heading: "Families love us", rating: "4.9", count: "120", source: "Google", link_label: "Read our reviews", link: "" },
  },
  {
    type: "compare",
    group: "trust",
    label: "Why choose us",
    hint: "Side by side: what you offer versus what families often find elsewhere",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Why families choose us" },
      { key: "us_label", label: "Your column title", kind: "text", placeholder: "With us" },
      { key: "us_items", label: "What you offer", kind: "list", itemLabel: "point", max: 8, fields: [{ key: "text", label: "Point", kind: "text" }] },
      { key: "other_label", label: "Other column title", kind: "text", placeholder: "Elsewhere" },
      { key: "other_items", label: "What families often find elsewhere", kind: "list", itemLabel: "point", max: 8, fields: [{ key: "text", label: "Point", kind: "text" }] },
    ],
    defaults: { heading: "Why families choose us", us_label: "With us", us_items: [{ text: "A callback within one business day" }, { text: "Parents are part of the team" }, { text: "Individualized, play-based plans" }, { text: "Regular progress updates" }], other_label: "Elsewhere", other_items: [{ text: "Long waits to hear back" }, { text: "One-size-fits-all programs" }, { text: "Little communication with parents" }] },
  },
  {
    type: "promises",
    group: "trust",
    label: "Promise strip",
    hint: "A slim row of short commitments, like “Intake within 5 days”",
    fields: [
      { key: "items", label: "Promises", kind: "list", itemLabel: "promise", max: 5, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "title", label: "Promise", kind: "text", placeholder: "Intake within 5 days" }, { key: "text", label: "Detail (optional)", kind: "text" }] },
    ],
    defaults: { items: [{ icon: "clock-check", title: "Intake within 5 days", text: "" }, { icon: "phone-call", title: "Same-week callback", text: "" }, { icon: "shield-check", title: "Insurance verified for you", text: "" }] },
  },
  {
    type: "roles",
    group: "people",
    label: "Who does what",
    hint: "Explain roles like BCBA, RBT and parent coach in plain language",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Who's on your child's team" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Roles", kind: "list", itemLabel: "role", max: 6, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "name", label: "Role", kind: "text", placeholder: "BCBA" }, { key: "text", label: "What they do", kind: "textarea" }] },
    ],
    defaults: { heading: "Who's on your child's team", subhead: "", items: [{ icon: "brain", name: "BCBA", text: "A Board Certified Behavior Analyst designs your child's plan and guides the team." }, { icon: "heart", name: "RBT", text: "A Registered Behavior Technician works with your child in sessions every week." }, { icon: "users", name: "Parent coach", text: "Helps you use the same strategies at home so progress carries over." }] },
  },
  {
    type: "referral",
    group: "locations",
    label: "Referral callout",
    hint: "A card for pediatricians, schools and other professionals to make a referral",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Referring a family?" },
      { key: "text", label: "Text", kind: "textarea" },
      ...buttonFields,
    ],
    defaults: { heading: "Referring a family?", text: "Pediatricians, schools and other professionals: we make referrals simple and keep you updated.", primary_label: "Make a referral", primary_link: "", secondary_label: "", secondary_link: "" },
  },
  {
    type: "funding",
    group: "start",
    label: "Costs & funding",
    hint: "Short cards on how families pay: Medicaid, private insurance, self-pay",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "How paying for ABA works" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Options", kind: "list", itemLabel: "option", max: 6, fields: [{ key: "icon", label: "Icon (optional)", kind: "icon" }, { key: "title", label: "Title", kind: "text", placeholder: "Private insurance" }, { key: "text", label: "Description", kind: "textarea" }, { key: "link", label: "Link (optional)", kind: "link" }] },
    ],
    defaults: { heading: "How paying for ABA works", subhead: "We'll check your benefits and explain every cost before you commit.", items: [{ icon: "shield-check", title: "Private insurance", text: "Many plans cover ABA. We verify your benefits and handle the paperwork.", link: "" }, { icon: "building-hospital", title: "Medicaid", text: "Medicaid covers ABA in many states. We'll help you find out what applies to you.", link: "" }, { icon: "wallet", title: "Self-pay", text: "Ask us about rates and payment options.", link: "" }] },
  },
  {
    type: "timeline",
    group: "start",
    label: "A day in the life",
    hint: "A typical session or day, step by step with times",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "What a session looks like" },
      { key: "items", label: "Steps", kind: "list", itemLabel: "step", max: 10, fields: [{ key: "time", label: "Time or label", kind: "text", placeholder: "First 10 minutes" }, { key: "title", label: "Title", kind: "text", placeholder: "Warm-up play" }, { key: "text", label: "Description", kind: "textarea" }] },
    ],
    defaults: { heading: "What a session looks like", items: [{ time: "Arrival", title: "Warm-up play", text: "Your child settles in with a favorite activity and their therapist." }, { time: "Mid-session", title: "Learning through play", text: "Goals are worked on through games, books and everyday routines." }, { time: "Wrap-up", title: "Parent check-in", text: "You hear what went well and what to try at home." }] },
  },
  {
    type: "portal",
    group: "locations",
    label: "Parent portal link",
    hint: "One clear button to the login your families already use",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Already a client?" },
      { key: "text", label: "Text", kind: "text", placeholder: "Sign in to see schedules, notes and invoices." },
      { key: "primary_label", label: "Button text", kind: "text", placeholder: "Parent login" },
      { key: "primary_link", label: "Button link", kind: "link" },
    ],
    defaults: { heading: "Already a client?", text: "Sign in to see schedules, session notes and invoices.", primary_label: "Parent login", primary_link: "" },
  },
  {
    type: "downloads",
    group: "start",
    label: "Forms to download",
    hint: "Intake packets and forms families can download before visiting, uploaded or linked",
    fields: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Forms to complete before your visit" },
      { key: "subhead", label: "Subheading", kind: "text" },
      { key: "items", label: "Forms", kind: "list", itemLabel: "form", max: 12, fields: [{ key: "title", label: "Title", kind: "text", placeholder: "New client intake packet" }, { key: "text", label: "Description (optional)", kind: "text" }, { key: "doc", label: "Upload a file (PDF or Word)", kind: "file" }, { key: "link", label: "Or link to the file", kind: "link" }] },
    ],
    defaults: { heading: "Forms to complete before your visit", subhead: "", items: [{ title: "New client intake packet", text: "Takes about 15 minutes.", link: "" }, { title: "Insurance information form", text: "", link: "" }] },
  },
  {
    type: "access",
    group: "start",
    label: "Languages & accessibility",
    hint: "Languages spoken and accommodations you offer",
    fields: [
      { key: "languages_heading", label: "Languages heading", kind: "text", placeholder: "Languages we speak" },
      { key: "languages", label: "Languages", kind: "textarea", hint: "One per line, or separated by commas." },
      { key: "access_heading", label: "Accessibility heading", kind: "text", placeholder: "Accessibility" },
      { key: "access", label: "Accommodations", kind: "textarea", hint: "One per line." },
    ],
    defaults: { languages_heading: "Languages we speak", languages: "English\nSpanish", access_heading: "Accessibility", access: "Wheelchair-accessible entrance\nQuiet, low-stimulation spaces\nInterpreters available on request" },
  },
  {
    type: "spacer",
    group: "utility",
    label: "Spacer / divider",
    hint: "Extra space or a thin line between blocks",
    fields: [
      { key: "size", label: "Space", kind: "choice", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] },
      { key: "line", label: "Line", kind: "choice", options: [{ value: "none", label: "No line" }, { value: "line", label: "Thin line" }] },
    ],
    defaults: { size: "md", line: "none" },
  },
  {
    type: "two_columns",
    group: "utility",
    label: "Two columns of text",
    hint: "Two side-by-side columns, each with a heading and formatted text",
    fields: [
      { key: "heading", label: "Main heading (optional)", kind: "text" },
      { key: "left_heading", label: "Left heading", kind: "text" },
      { key: "left_body", label: "Left text", kind: "richtext" },
      { key: "right_heading", label: "Right heading", kind: "text" },
      { key: "right_body", label: "Right text", kind: "richtext" },
    ],
    defaults: { heading: "", left_heading: "For parents", left_body: "<p>Write something here.</p>", right_heading: "For professionals", right_body: "<p>Write something here.</p>" },
  },
  {
    type: "banner",
    group: "utility",
    label: "Banner image",
    hint: "A full-width photo with an optional caption",
    fields: [
      { key: "image", label: "Photo", kind: "image" },
      { key: "caption", label: "Caption (optional)", kind: "text" },
      { key: "height", label: "Height", kind: "choice", options: [{ value: "sm", label: "Short" }, { value: "md", label: "Medium" }, { value: "lg", label: "Tall" }] },
    ],
    defaults: { caption: "", height: "md" },
  },
  {
    type: "social",
    group: "locations",
    label: "Social links",
    hint: "Icon buttons for Facebook, Instagram, YouTube and more",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text", placeholder: "Follow along" },
      { key: "items", label: "Links", kind: "list", itemLabel: "link", max: 8, hint: "Search “facebook”, “instagram” and so on in the icon picker.", fields: [{ key: "icon", label: "Icon", kind: "icon" }, { key: "label", label: "Name (for screen readers)", kind: "text", placeholder: "Facebook" }, { key: "link", label: "Link", kind: "link" }] },
    ],
    defaults: { heading: "Follow along", items: [{ icon: "brand-facebook", label: "Facebook", link: "" }, { icon: "brand-instagram", label: "Instagram", link: "" }, { icon: "brand-youtube", label: "YouTube", link: "" }] },
  },
  {
    type: "map",
    group: "locations",
    label: "Map",
    hint: "A full-width map of one address",
    fields: [
      { key: "heading", label: "Heading (optional)", kind: "text" },
      { key: "address", label: "Address", kind: "text", placeholder: "123 Main Street, Austin, TX 78701" },
      { key: "height", label: "Height", kind: "choice", options: [{ value: "sm", label: "Short" }, { value: "md", label: "Medium" }, { value: "lg", label: "Tall" }] },
    ],
    defaults: { heading: "", address: "", height: "md" },
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

// Documents uploaded to a block, stored in list rows as "<key>_file" (the key sub-field "doc" gives "doc_file") with the
// original name in "<key>_filename". They live in the "block-files" bucket, so they are tracked apart from images.
export function collectFilePaths(c: BlockConfig): string[] {
  const out: string[] = [];
  for (const v of Object.values(c)) {
    if (!Array.isArray(v)) continue;
    for (const row of v) if (row && typeof row === "object") for (const [k, p] of Object.entries(row)) if (k.endsWith("_file") && typeof p === "string" && p) out.push(p);
  }
  return out;
}
// Key renderers use to find an uploaded document's URL in the same path-to-URL map as images.
export const fileKey = (path: string | undefined) => (path ? `file:${path}` : "");

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

// Form embeds are shown in our own sandboxed <iframe>, never as pasted HTML. Accepts either the provider's
// "<iframe src=...>" snippet or a plain link; returns the https URL, "" for none, or null if unusable.
export function normalizeEmbed(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  const src = /^<iframe[\s>]/i.test(v) ? /\ssrc\s*=\s*["']([^"']+)["']/i.exec(v)?.[1] : v;
  if (!src) return null;
  try {
    const url = new URL(src.replace(/&amp;/g, "&"));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Canonical privacy-friendly embed URL for a YouTube or Vimeo link, "" for none, null if it isn't one of those.
export function videoEmbedUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    const host = url.hostname.replace(/^(www\.|m\.)/, "");
    let id: string | undefined;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") id = url.searchParams.get("v") ?? /^\/(?:embed|shorts|live)\/([^/?]+)/.exec(url.pathname)?.[1];
    if (id !== undefined) return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const vid = /(\d{5,})/.exec(url.pathname)?.[1];
      return vid ? `https://player.vimeo.com/video/${vid}?dnt=1` : null;
    }
  } catch {}
  return null;
}

// A short line for the dashboard list.
export function blockSummary(type: string, c: BlockConfig) {
  if (type === "announcement") return configText(c, "text");
  if (type === "testimonial") return configText(c, "quote");
  if (type === "stats") return configList(c).map((i) => `${i.value ?? ""} ${i.label ?? ""}`.trim()).join(" · ");
  if (["insurance", "credentials", "partners"].includes(type)) return configList(c).map((i) => i.name).filter(Boolean).join(" · ");
  if (["testimonials", "outcomes"].includes(type)) return configText(c, "heading");
  if (type === "photos") return configText(c, "heading") || `${configList(c).filter((i) => i.photo_path).length} photos`;
  if (type === "quick_actions") return configItems(c).filter((i) => i.label).map((i) => i.label).join(" · ");
  if (type === "contact_form") {
    try { return configText(c, "embed") ? `Form from ${new URL(configText(c, "embed")).hostname}` : "No form added yet"; } catch { return ""; }
  }
  if (type === "contact_info") return [configText(c, "phone"), configText(c, "email")].filter(Boolean).join(" · ");
  if (type === "reviews") return [configText(c, "rating") && `${configText(c, "rating")} stars`, configText(c, "count") && `${configText(c, "count")} reviews`].filter(Boolean).join(" · ");
  if (type === "compare" || type === "access") return configText(c, "heading") || configText(c, "languages_heading");
  if (type === "referral" || type === "portal") return configText(c, "heading");
  if (type === "spacer") return `${{ sm: "Small", md: "Medium", lg: "Large" }[configText(c, "size")] ?? "Medium"} space${configText(c, "line") === "line" ? " with a line" : ""}`;
  if (type === "banner") return configText(c, "caption") || (configText(c, "image_path") ? "Photo" : "No photo yet");
  if (type === "map") return configText(c, "address") || configText(c, "heading");
  if (type === "social") return configList(c).filter((i) => i.link).map((i) => i.label || i.icon).join(" · ");
  if (type === "two_columns") return [configText(c, "left_heading"), configText(c, "right_heading")].filter(Boolean).join(" · ");
  if (type === "cta") return configText(c, "heading");
  if (type === "letter") return configText(c, "name") || configText(c, "heading");
  if (type === "careers") return configText(c, "heading");
  if (type === "approach" || type === "first_day") return configText(c, "heading");
  if (type === "faq") return configList(c).map((i) => i.question).filter(Boolean).join(" · ");
  if (type === "availability") return configText(c, "message") || AVAILABILITY[configText(c, "status") as keyof typeof AVAILABILITY]?.text || "";
  if (["services", "services_list", "settings", "ages", "values", "steps", "team", "positions", "locations", "resources", "workshops", "glossary", "compliance", "crisis", "promises", "roles", "funding", "timeline", "downloads"].includes(type)) {
    return configList(c).map((i) => i.title || i.name || i.label || i.term || i.text).filter(Boolean).join(" · ");
  }
  return configText(c, "headline") || configText(c, "heading");
}
