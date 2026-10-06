import Link from "next/link";
import { Icon, LibraryIcon } from "@/components/icons";
import { CountUp } from "./count-up";
import { Gallery } from "./gallery";
import { PhotoCarousel } from "./photo-carousel";
import { formatNewsDate, sortByDateDesc, storyText, type NewsItem } from "@/lib/news";
import { SHAPE_CLASSES, type PhotoShape } from "@/lib/directors";
import { sanitizeRichText } from "@/lib/richtext";
import { AVAILABILITY, configItems, configList, configText, fileKey, libraryKey, type HomeBlock } from "@/lib/blocks";

type Urls = Record<string, string>;
// A row's own upload, or else the shared-library logo they picked.
const logoOf = (row: Record<string, string>, urls: Urls) => urlOf(urls, row.logo_path) ?? urlOf(urls, libraryKey(row.logo_lib));
// An uploaded document wins over a pasted link.
const docHref = (row: Record<string, string>, urls: Record<string, string>) => (row.doc_file ? urls[fileKey(row.doc_file)] : "") || row.link || "";
const urlOf = (urls: Urls, path: string | undefined) => (path ? urls[path] || null : null);

const THEME = "var(--theme-color, #111827)";

// Site-internal links ("/about", "#faq") use the router; everything else (http, tel, mailto) is a plain anchor.
function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return /^(\/|#)/.test(href) ? (
    <Link href={href} className={className} style={style}>{children}</Link>
  ) : (
    <a href={href} className={className} style={style} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>
  );
}

const buttonBase = "inline-flex items-center rounded-xl px-6 py-3 font-medium shadow-sm transition hover:opacity-85";

// "onDark" is for buttons sitting on the theme color or a photo: white fill with theme-colored text, and a white outline for the second.
function Buttons({ c, onDark, center }: { c: HomeBlock["config"]; onDark?: boolean; center?: boolean }) {
  const primary = configText(c, "primary_label") && configText(c, "primary_link");
  const secondary = configText(c, "secondary_label") && configText(c, "secondary_link");
  if (!primary && !secondary) return null;
  return (
    <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      {primary && (
        <SmartLink
          href={configText(c, "primary_link")}
          className={buttonBase}
          style={onDark ? { backgroundColor: "#fff", color: THEME } : { backgroundColor: THEME, color: "#fff" }}
        >
          {configText(c, "primary_label")}
        </SmartLink>
      )}
      {secondary && (
        <SmartLink
          href={configText(c, "secondary_link")}
          className={`${buttonBase} ring-2 ring-inset`}
          style={onDark ? { color: "#fff", ["--tw-ring-color" as string]: "rgba(255,255,255,0.85)" } : { color: THEME, ["--tw-ring-color" as string]: THEME }}
        >
          {configText(c, "secondary_label")}
        </SmartLink>
      )}
    </div>
  );
}

export function AnnouncementBar({ block }: { block: HomeBlock }) {
  const c = block.config;
  const text = configText(c, "text");
  if (!text) return null;
  const solid = configText(c, "style") !== "light";
  const link = configText(c, "link");
  return (
    <div
      className="px-6 py-2 text-center text-sm"
      style={solid ? { backgroundColor: THEME, color: "#fff" } : { backgroundColor: `color-mix(in srgb, ${THEME} 10%, white)`, color: THEME }}
    >
      <span className="font-medium">{text}</span>
      {link && (
        <SmartLink href={link} className="ml-2 inline-flex items-center gap-1 font-semibold underline underline-offset-4">
          {configText(c, "link_label") || "Learn more"} <Icon name="arrow-right" className="h-3.5 w-3.5" />
        </SmartLink>
      )}
    </div>
  );
}

function Hero({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const imageUrl = urlOf(urls, configText(c, "image_path"));
  const center = configText(c, "align") !== "left";
  return (
    <section
      className="relative isolate overflow-hidden text-white"
      style={{ backgroundColor: THEME, ...(imageUrl ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}
    >
      {/* Darkens the photo so white text stays readable whatever the image is. */}
      {imageUrl && <div className="absolute inset-0 -z-10 bg-black/55" />}
      <div className={`mx-auto max-w-4xl space-y-6 px-6 py-24 sm:py-32 ${center ? "text-center" : ""}`}>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{configText(c, "headline")}</h1>
        {configText(c, "subhead") && <p className={`max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl ${center ? "mx-auto" : ""}`}>{configText(c, "subhead")}</p>}
        <Buttons c={c} onDark center={center} />
      </div>
    </section>
  );
}

function HeroSplit({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const imageUrl = urlOf(urls, configText(c, "image_path"));
  const imageLeft = configText(c, "image_side") === "left";
  return (
    <section>
      <div className={`mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 ${imageUrl ? "md:grid-cols-2" : ""}`}>
        <div className={`space-y-6 ${imageLeft ? "md:order-2" : ""}`}>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ color: THEME }}>{configText(c, "headline")}</h1>
          {configText(c, "subhead") && <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">{configText(c, "subhead")}</p>}
          <Buttons c={c} />
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
          <img src={imageUrl} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg" />
        )}
      </div>
    </section>
  );
}

function QuickActions({ block }: { block: HomeBlock }) {
  const items = configItems(block.config).filter((i) => i.label);
  if (items.length === 0) return null;
  const card = "flex h-full flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-900/5 transition";
  const inner = (i: (typeof items)[number]) => (
    <>
      {i.icon && <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>
        <LibraryIcon name={i.icon} className="h-6 w-6" />
      </span>}
      <span className="font-semibold text-gray-900">{i.label}</span>
    </>
  );
  return (
    <section className="bg-gray-50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 py-10 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ "--n": items.length } as React.CSSProperties}>
        {items.map((i, n) =>
          i.link ? (
            <SmartLink key={n} href={i.link} className={`${card} hover:-translate-y-0.5 hover:shadow-md`}>{inner(i)}</SmartLink>
          ) : (
            <div key={n} className={card}>{inner(i)}</div>
          ),
        )}
      </div>
    </section>
  );
}

const heading = (text: string) => (text ? <h2 className="text-center text-2xl font-semibold sm:text-3xl" style={{ color: THEME }}>{text}</h2> : null);

// A plan shows as its logo when there is one, plain text otherwise, so it can be listed before its logo is uploaded.
function PlanLogo({ plan, urls }: { plan: Record<string, string>; urls: Urls }) {
  const logo = logoOf(plan, urls);
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
    <img src={logo} alt={plan.name || ""} className="max-h-12 w-auto max-w-[9rem] object-contain" />
  ) : (
    <span className="whitespace-nowrap rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-700">{plan.name}</span>
  );
}

function Insurance({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.logo_path || i.logo_lib);
  if (items.length === 0) return null;
  const link = configText(c, "link");
  const scroll = configText(c, "layout") === "scroll";
  // Each half of the marquee must be wider than the screen or a gap shows, so a short list is repeated to fill it.
  const half = Array.from({ length: Math.ceil(10 / items.length) }, () => items).flat();
  return (
    <section>
      <div className="space-y-8 py-14">
        <div className="mx-auto max-w-5xl space-y-2 px-6 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "subhead") && <p className="text-lg text-gray-600">{configText(c, "subhead")}</p>}
        </div>
        {scroll ? (
          <div className="marquee overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)" }}>
            <ul className="marquee-track flex w-max items-center" style={{ "--dur": `${half.length * 4}s` } as React.CSSProperties}>
              {[0, 1].flatMap((copy) =>
                half.map((plan, n) => (
                  <li key={`${copy}-${n}`} aria-hidden={copy === 1} className="flex h-16 items-center px-7"><PlanLogo plan={plan} urls={urls} /></li>
                )),
              )}
            </ul>
          </div>
        ) : (
          <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((plan, n) => (
              <li key={n} className="flex h-24 items-center justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5"><PlanLogo plan={plan} urls={urls} /></li>
            ))}
          </ul>
        )}
        {link && (
          <div className="px-6 text-center">
            <SmartLink href={link} className={buttonBase} style={{ backgroundColor: THEME, color: "#fff" }}>{configText(c, "link_label") || "Verify my coverage"}</SmartLink>
          </div>
        )}
      </div>
    </section>
  );
}

function Photos({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const slides = configList(c).flatMap((i) => {
    const url = urlOf(urls, i.photo_path);
    return url ? [{ url, caption: i.caption ?? "" }] : [];
  });
  if (slides.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        <PhotoCarousel slides={slides} seconds={Number(configText(c, "seconds")) || 6} arrows={configText(c, "arrows") !== "hide"} />
      </div>
    </section>
  );
}

function Credentials({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.logo_path || i.logo_lib);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-8">
          {items.map((i, n) => {
            const badge = logoOf(i, urls);
            return (
              <li key={n} className="flex w-36 flex-col items-center gap-3 text-center">
                {badge ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
                  <img src={badge} alt="" className="h-16 w-auto max-w-full object-contain" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>
                    <Icon name="shield-check" className="h-8 w-8" />
                  </span>
                )}
                {i.name && <span className="text-sm font-medium text-gray-700">{i.name}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Stats({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.value || i.label);
  if (items.length === 0) return null;
  // Same rule as the header: dark = theme color background with white text; light = white background with theme-colored text.
  const dark = configText(c, "style") !== "light";
  return (
    <section className={dark ? "" : "border-y border-gray-200"} style={dark ? { backgroundColor: THEME, color: "#fff" } : { color: THEME }}>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
        {configText(c, "heading") && <h2 className="text-center text-2xl font-semibold sm:text-3xl">{configText(c, "heading")}</h2>}
        <dl className="flex flex-wrap justify-center gap-x-16 gap-y-8">
          {items.map((i, n) => (
            <div key={n} className="flex min-w-36 flex-col-reverse text-center">
              <dt className="mt-1 text-lg opacity-80">{i.label}</dt>
              <dd className="text-5xl font-bold">
                {i.icon && <span className="mx-auto mb-4 block w-fit opacity-90"><LibraryIcon name={i.icon} className="h-11 w-11" strokeWidth={1.5} /></span>}
                <CountUp value={i.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Person({ name, photo }: { name?: string; photo: string | null }) {
  if (!name && !photo) return null;
  return (
    <div className="flex items-center gap-3">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
        <img src={photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      )}
      {name && <span className="font-medium text-gray-900">{name}</span>}
    </div>
  );
}

function Testimonials({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.quote);
  if (items.length === 0) return null;
  const scroll = configText(c, "layout") === "scroll";
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        {/* The swipeable row is plain CSS scroll-snap: no script, works with touch and trackpad. */}
        <ul className={scroll ? "-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-3" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
          {items.map((i, n) => (
            <li key={n} className={`flex flex-col justify-between gap-6 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5 ${scroll ? "w-[85%] shrink-0 snap-center sm:w-96" : ""}`}>
              <p className="text-lg leading-relaxed text-gray-700">“{i.quote}”</p>
              <Person name={i.name} photo={urlOf(urls, i.photo_path)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Testimonial({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  if (!configText(c, "quote")) return null;
  return (
    <section>
      <figure className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-center">
        <span style={{ color: THEME }}><Icon name="quote" className="mx-auto h-9 w-9" /></span>
        <blockquote className="text-2xl font-medium leading-relaxed text-gray-800 sm:text-3xl" style={{ color: THEME }}>{configText(c, "quote")}</blockquote>
        <figcaption className="flex justify-center"><Person name={configText(c, "name")} photo={urlOf(urls, configText(c, "photo_path"))} /></figcaption>
      </figure>
    </section>
  );
}

function Outcomes({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((i, n) => (
            <li key={n} className="space-y-2 rounded-2xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-gray-900/5" style={{ borderLeftColor: THEME }}>
              {i.title && <h3 className="text-lg font-semibold text-gray-900">{i.title}</h3>}
              {i.text && <p className="leading-relaxed text-gray-600">{i.text}</p>}
            </li>
          ))}
        </ul>
        {configText(c, "note") && <p className="text-center text-sm text-gray-500">{configText(c, "note")}</p>}
      </div>
    </section>
  );
}

const iconCircle = (size: string) => ({ className: `flex ${size} shrink-0 items-center justify-center rounded-full`, style: { backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME } });

function SectionHead({ c }: { c: HomeBlock["config"] }) {
  if (!configText(c, "heading") && !configText(c, "subhead")) return null;
  return (
    <div className="space-y-2 text-center">
      {heading(configText(c, "heading"))}
      {configText(c, "subhead") && <p className="mx-auto max-w-2xl text-lg text-gray-600">{configText(c, "subhead")}</p>}
    </div>
  );
}

function Services({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  const card = "flex h-full flex-col gap-3 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5 transition";
  const inner = (i: Record<string, string>) => (
    <>
      {i.icon && <span {...iconCircle("h-12 w-12")}><LibraryIcon name={i.icon} className="h-6 w-6" /></span>}
      {i.title && <h3 className="text-xl font-semibold text-gray-900">{i.title}</h3>}
      {i.text && <p className="leading-relaxed text-gray-600">{i.text}</p>}
      {i.link && <span className="mt-auto inline-flex items-center gap-1 pt-2 font-medium" style={{ color: THEME }}>Learn more <Icon name="arrow-right" className="h-4 w-4" /></span>}
    </>
  );
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i, n) => (
            <li key={n}>{i.link ? <SmartLink href={i.link} className={`${card} hover:-translate-y-0.5 hover:shadow-md`}>{inner(i)}</SmartLink> : <div className={card}>{inner(i)}</div>}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServicesList({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text || i.image_path);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-14 px-6 py-14">
        <SectionHead c={c} />
        {items.map((i, n) => {
          const image = urlOf(urls, i.image_path);
          return (
            <div key={n} className={`grid items-center gap-8 md:gap-12 ${image ? "md:grid-cols-2" : "mx-auto max-w-3xl"}`}>
              {/* Rows alternate which side the photo is on. */}
              <div className={`space-y-4 ${n % 2 === 1 ? "md:order-2" : ""}`}>
                {i.title && <h3 className="text-2xl font-semibold sm:text-3xl" style={{ color: THEME }}>{i.title}</h3>}
                {i.text && <p className="text-lg leading-relaxed text-gray-600">{i.text}</p>}
                {i.link && (
                  <SmartLink href={i.link} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-85" style={{ backgroundColor: THEME }}>
                    {i.link_label || "Learn more"} <Icon name="arrow-right" className="h-4 w-4" />
                  </SmartLink>
                )}
              </div>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
                <img src={image} alt={i.title || ""} loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CareSettings({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.text);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid gap-5 sm:grid-cols-2">
          {items.map((i, n) => (
            <li key={n} className="flex gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              {i.icon && <span {...iconCircle("h-14 w-14")}><LibraryIcon name={i.icon} className="h-7 w-7" /></span>}
              <div className="space-y-1">
                {i.name && <h3 className="text-xl font-semibold text-gray-900">{i.name}</h3>}
                {i.text && <p className="leading-relaxed text-gray-600">{i.text}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Ages({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.range || i.label);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ "--n": Math.min(items.length, 4) } as React.CSSProperties}>
          {items.map((i, n) => (
            <li key={n} className="space-y-2 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-900/5">
              {i.range && <p className="text-3xl font-bold" style={{ color: THEME }}>{i.range}</p>}
              {i.label && <h3 className="text-lg font-semibold text-gray-900">{i.label}</h3>}
              {i.text && <p className="text-gray-600">{i.text}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Approach({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const image = urlOf(urls, configText(c, "image_path"));
  const body = sanitizeRichText(configText(c, "body"));
  const imageLeft = configText(c, "image_side") === "left";
  return (
    <section>
      <div className={`mx-auto grid items-center gap-10 px-6 py-16 ${image ? "max-w-6xl md:grid-cols-2" : "max-w-3xl"}`}>
        <div className={`space-y-4 ${imageLeft ? "md:order-2" : ""}`}>
          {configText(c, "heading") && <h2 className="text-3xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
          <div className="rich text-lg leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: body }} />
          <Buttons c={c} />
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
          <img src={image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg" />
        )}
      </div>
    </section>
  );
}

function Values({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i, n) => (
            <li key={n} className="flex flex-col items-center gap-3 text-center">
              {i.icon && <span {...iconCircle("h-14 w-14")}><LibraryIcon name={i.icon} className="h-7 w-7" /></span>}
              {i.title && <h3 className="text-xl font-semibold text-gray-900">{i.title}</h3>}
              {i.text && <p className="max-w-xs leading-relaxed text-gray-600">{i.text}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Steps({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-14">
        <SectionHead c={c} />
        {/* Vertical on small screens, a row of columns on large ones; each step draws its own connector to the next. */}
        <ol className="grid gap-x-6 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ "--n": items.length } as React.CSSProperties}>
          {items.map((i, n) => (
            <li key={n} className="relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:items-center lg:gap-3 lg:pb-0 lg:text-center">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: THEME }}>{n + 1}</span>
              {n < items.length - 1 && <span aria-hidden className="absolute bottom-0 left-5 top-10 w-0.5 -translate-x-1/2 bg-gray-200 lg:hidden" />}
              {n < items.length - 1 && <span aria-hidden className="absolute left-[calc(50%+1.5rem)] top-5 hidden h-0.5 w-[calc(100%-1.5rem)] bg-gray-200 lg:block" />}
              <div className="space-y-1">
                {i.title && <h3 className="text-lg font-semibold text-gray-900">{i.title}</h3>}
                {i.text && <p className="leading-relaxed text-gray-600">{i.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Native <details>: opens and closes without any script and works with the keyboard and screen readers.
function Faq({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.question);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-14">
        <SectionHead c={c} />
        <div className="space-y-3">
          {items.map((i, n) => (
            <details key={n} className="group rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                {i.question}
                <Icon name="chevron-down" className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              {i.answer && <p className="whitespace-pre-line px-5 pb-5 leading-relaxed text-gray-600">{i.answer}</p>}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FirstDay({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.text);
  const body = sanitizeRichText(configText(c, "body"));
  return (
    <section style={{ backgroundColor: `color-mix(in srgb, ${THEME} 7%, white)` }}>
      <div className={`mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 ${items.length > 0 ? "md:grid-cols-2" : "max-w-3xl"}`}>
        <div className="space-y-4">
          {configText(c, "heading") && <h2 className="text-3xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
          <div className="rich text-lg leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: body }} />
        </div>
        {items.length > 0 && (
          <div className="space-y-4 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5">
            {configText(c, "list_heading") && <h3 className="text-lg font-semibold text-gray-900">{configText(c, "list_heading")}</h3>}
            <ul className="space-y-3">
              {items.map((i, n) => (
                <li key={n} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: THEME }}><Icon name="check" className="h-3.5 w-3.5" /></span>
                  {i.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Availability({ block }: { block: HomeBlock }) {
  const c = block.config;
  const look = AVAILABILITY[configText(c, "status") as keyof typeof AVAILABILITY] ?? AVAILABILITY.accepting;
  const link = configText(c, "link");
  return (
    <section>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 px-6 py-8">
        <span className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 font-medium text-gray-900 ring-1" style={{ backgroundColor: look.tint, ["--tw-ring-color" as string]: look.ring }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: look.dot }} />
          {configText(c, "message") || look.text}
        </span>
        {link && configText(c, "link_label") && (
          <SmartLink href={link} className={buttonBase} style={{ backgroundColor: THEME, color: "#fff" }}>{configText(c, "link_label")}</SmartLink>
        )}
      </div>
    </section>
  );
}

function Team({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.photo_path);
  if (items.length === 0) return null;
  const shape = (configText(c, "shape") in SHAPE_CLASSES ? configText(c, "shape") : "circle") as PhotoShape;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((i, n) => {
            const photo = urlOf(urls, i.photo_path);
            return (
              <li key={n} className="space-y-3 text-center">
                {/* Without a photo, an empty tinted shape keeps the grid even. */}
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
                  <img src={photo} alt={i.name || ""} loading="lazy" className={`mx-auto w-full max-w-48 object-cover shadow-sm ${SHAPE_CLASSES[shape]}`} />
                ) : (
                  <div className={`mx-auto w-full max-w-48 ${SHAPE_CLASSES[shape]}`} style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)` }} />
                )}
                <div className="space-y-1">
                  {i.name && <h3 className="text-lg font-semibold text-gray-900">{i.name}</h3>}
                  {i.role && <p className="text-sm font-medium" style={{ color: THEME }}>{i.role}</p>}
                  {i.bio && <p className="pt-1 text-sm leading-relaxed text-gray-600">{i.bio}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Letter({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const photo = urlOf(urls, configText(c, "photo_path"));
  const name = configText(c, "name");
  return (
    <section className="bg-gray-50">
      <div className={`mx-auto grid items-start gap-10 px-6 py-16 ${photo ? "max-w-5xl md:grid-cols-[16rem_1fr]" : "max-w-3xl"}`}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
          <img src={photo} alt={name} loading="lazy" className="mx-auto aspect-[4/5] w-full max-w-64 rounded-3xl object-cover shadow-lg" />
        )}
        <div className="space-y-5">
          {configText(c, "heading") && <h2 className="text-3xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
          <div className="rich text-lg leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(configText(c, "body")) }} />
          {(name || configText(c, "title")) && (
            <div className="pt-2">
              {name && configText(c, "signature") !== "hide" && (
                <p className="text-4xl leading-tight" style={{ fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive', color: THEME }}>{name}</p>
              )}
              {name && <p className="mt-1 font-semibold text-gray-900">{name}</p>}
              {configText(c, "title") && <p className="text-gray-600">{configText(c, "title")}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Careers({ block }: { block: HomeBlock }) {
  const c = block.config;
  const dark = configText(c, "style") !== "light";
  const link = configText(c, "link");
  return (
    <section
      style={dark ? { backgroundColor: THEME, color: "#fff" } : { backgroundColor: `color-mix(in srgb, ${THEME} 10%, white)`, color: THEME }}
    >
      <div className="mx-auto max-w-4xl space-y-5 px-6 py-16 text-center">
        {configText(c, "heading") && <h2 className="text-3xl font-bold sm:text-4xl">{configText(c, "heading")}</h2>}
        {configText(c, "text") && <p className="mx-auto max-w-2xl text-lg leading-relaxed opacity-90">{configText(c, "text")}</p>}
        {link && configText(c, "link_label") && (
          <div className="pt-2">
            <SmartLink href={link} className={buttonBase} style={dark ? { backgroundColor: "#fff", color: THEME } : { backgroundColor: THEME, color: "#fff" }}>{configText(c, "link_label")}</SmartLink>
          </div>
        )}
      </div>
    </section>
  );
}

function Positions({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title);
  if (items.length === 0 && !configText(c, "empty_text") && !configText(c, "heading")) return null;
  return (
    <section>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "intro") && <p className="text-lg text-gray-600">{configText(c, "intro")}</p>}
        </div>
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((i, n) => (
              <li key={n} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-gray-900">{i.title}</h3>
                  {(i.location || i.kind) && (
                    <p className="flex flex-wrap gap-2 text-sm">
                      {i.location && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600"><Icon name="map-pin" className="h-3.5 w-3.5" />{i.location}</span>}
                      {i.kind && <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>{i.kind}</span>}
                    </p>
                  )}
                </div>
                {i.link && (
                  <SmartLink href={i.link} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-85" style={{ backgroundColor: THEME }}>
                    Apply <Icon name="arrow-right" className="h-4 w-4" />
                  </SmartLink>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-gray-50 px-6 py-8 text-center text-gray-600">{configText(c, "empty_text")}</p>
        )}
      </div>
    </section>
  );
}

function Locations({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.address);
  const areas = configText(c, "areas").split(/[\n,]+/).map((a) => a.trim()).filter(Boolean);
  if (items.length === 0 && areas.length === 0) return null;
  const showMap = configText(c, "map") !== "hide";
  const single = items.length === 1;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className={`grid gap-6 ${single ? "" : "md:grid-cols-2"}`}>
          {items.map((i, n) => (
            <li key={n} className={`grid gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 ${single && showMap && i.address ? "md:grid-cols-2" : ""}`}>
              <div className="space-y-4">
                {i.name && <h3 className="text-xl font-semibold text-gray-900">{i.name}</h3>}
                {i.address && (
                  <p className="flex gap-3 text-gray-700">
                    <span style={{ color: THEME }}><Icon name="map-pin" className="mt-1 h-5 w-5" /></span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.address.replace(/\n/g, ", "))}`} target="_blank" rel="noopener noreferrer" className="whitespace-pre-line underline-offset-4 hover:underline">{i.address}</a>
                  </p>
                )}
                {i.phone && (
                  <p className="flex gap-3 text-gray-700">
                    <span style={{ color: THEME }}><Icon name="phone" className="mt-1 h-5 w-5" /></span>
                    <a href={`tel:${i.phone.replace(/[^+0-9]/g, "")}`} className="underline-offset-4 hover:underline">{i.phone}</a>
                  </p>
                )}
                {i.hours && (
                  <p className="flex gap-3 text-gray-700">
                    <span style={{ color: THEME }}><LibraryIcon name="clock" className="mt-1 h-5 w-5" /></span>
                    <span className="whitespace-pre-line">{i.hours}</span>
                  </p>
                )}
              </div>
              {showMap && i.address && (
                // Google's no-key embed URL: the address is the search query. Lazy-loaded so it costs nothing until scrolled to.
                <iframe
                  title={`Map of ${i.name || i.address}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(i.address.replace(/\n/g, ", "))}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full rounded-2xl border-0 bg-gray-100"
                />
              )}
            </li>
          ))}
        </ul>
        {areas.length > 0 && (
          <div className="space-y-4 text-center">
            {configText(c, "areas_heading") && <h3 className="text-xl font-semibold text-gray-900">{configText(c, "areas_heading")}</h3>}
            <ul className="flex flex-wrap justify-center gap-2">
              {areas.map((a) => <li key={a} className="rounded-full bg-white px-4 py-1.5 font-medium text-gray-700 shadow-sm ring-1 ring-gray-900/5">{a}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// Straight embed: the visitor talks to the form provider directly, and nothing they type touches our server or database.
// Sandboxed so the framed page can run its own form but can't navigate or script ours.
// In the dashboard's preview sheet, third-party embeds are replaced by a neutral box rather than loading anything.
function EmbedPlaceholder({ icon, label, className }: { icon: string; label: string; className: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 bg-gray-100 text-gray-500 ${className}`}>
      <LibraryIcon name={icon} className="h-10 w-10" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function ContactForm({ block, preview }: { block: HomeBlock; preview?: boolean }) {
  const c = block.config;
  const src = configText(c, "embed");
  if (!src) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "intro") && <p className="text-lg text-gray-600">{configText(c, "intro")}</p>}
        </div>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-900/5">
          {preview ? <EmbedPlaceholder icon="clipboard-check" label="Your form appears here" className="h-80" /> : <iframe
            title={configText(c, "heading") || "Form"}
            src={src}
            loading="lazy"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            className="block w-full border-0"
            style={{ height: `${Number(configText(c, "height")) || 700}px` }}
          />}
        </div>
        {/* Some providers refuse to be framed, so a plain link is always available. */}
        <p className="text-center text-sm text-gray-500">
          Form not loading? <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4" style={{ color: THEME }}>Open it in a new page</a>.
        </p>
      </div>
    </section>
  );
}

function ContactInfo({ block }: { block: HomeBlock }) {
  const c = block.config;
  const dark = configText(c, "style") === "dark";
  const phone = configText(c, "phone");
  const email = configText(c, "email");
  const address = configText(c, "address");
  const hours = configText(c, "hours");
  const rows = [
    phone && { icon: "phone" as const, text: phone, href: `tel:${phone.replace(/[^+0-9]/g, "")}` },
    email && { icon: "mail" as const, text: email, href: `mailto:${email}` },
    address && { icon: "map-pin" as const, text: address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` },
    hours && { icon: "clock", text: hours, href: "" },
  ].filter(Boolean) as { icon: "phone" | "mail" | "map-pin" | "clock"; text: string; href: string }[];
  if (rows.length === 0) return null;
  return (
    <section style={dark ? { backgroundColor: THEME, color: "#fff" } : { backgroundColor: `color-mix(in srgb, ${THEME} 8%, white)`, color: THEME }}>
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 font-medium">
        {rows.map((r) => {
          const inner = (
            <>
              {r.icon === "clock" ? <LibraryIcon name="clock" className="h-5 w-5 shrink-0" /> : <Icon name={r.icon} className="h-5 w-5 shrink-0" />}
              <span>{r.text}</span>
            </>
          );
          return (
            <li key={r.icon}>
              {r.href ? (
                <a href={r.href} {...(r.icon === "map-pin" ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-2 underline-offset-4 hover:underline">{inner}</a>
              ) : (
                <span className="flex items-center gap-2">{inner}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Cta({ block }: { block: HomeBlock }) {
  const c = block.config;
  const dark = configText(c, "style") !== "light";
  return (
    <section style={dark ? { backgroundColor: THEME, color: "#fff" } : { backgroundColor: `color-mix(in srgb, ${THEME} 10%, white)`, color: THEME }}>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-16 text-center">
        {configText(c, "heading") && <h2 className="text-3xl font-bold sm:text-4xl">{configText(c, "heading")}</h2>}
        {configText(c, "text") && <p className="mx-auto max-w-2xl text-lg leading-relaxed opacity-90">{configText(c, "text")}</p>}
        <Buttons c={c} onDark={dark} center />
      </div>
    </section>
  );
}

function NewsFeed({ block, news, newsLabel }: { block: HomeBlock; news: NewsItem[]; newsLabel: string | null }) {
  const c = block.config;
  const items = sortByDateDesc(news).slice(0, Number(configText(c, "count")) || 3);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              {i.published_on && <p className="text-sm text-gray-500">{formatNewsDate(i.published_on)}</p>}
              <h3 className="text-xl font-semibold text-gray-900">{i.name}</h3>
              <p className="line-clamp-3 leading-relaxed text-gray-600">{storyText(i.story)}</p>
              {i.link && (
                <a href={i.link} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-1 font-medium" style={{ color: THEME }}>
                  Read more <Icon name="arrow-right" className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
        {newsLabel && (
          <div className="text-center">
            <SmartLink href="/news" className={buttonBase} style={{ backgroundColor: THEME, color: "#fff" }}>View all {newsLabel}</SmartLink>
          </div>
        )}
      </div>
    </section>
  );
}

function Resources({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title);
  if (items.length === 0) return null;
  const row = "flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition";
  const inner = (i: Record<string, string>, href: string) => (
    <>
      <span {...iconCircle("h-12 w-12")}><Icon name="file-text" className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">{i.title}</span>
          {i.tag && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{i.tag}</span>}
        </span>
        {i.text && <span className="mt-0.5 block text-gray-600">{i.text}</span>}
      </span>
      {href && <Icon name="arrow-right" className="h-5 w-5 shrink-0 text-gray-400" />}
    </>
  );
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-14">
        <SectionHead c={c} />
        <ul className="space-y-3">
          {items.map((i, n) => {
            const href = docHref(i, urls);
            return <li key={n}>{href ? <SmartLink href={href} className={`${row} hover:-translate-y-0.5 hover:shadow-md`}>{inner(i, href)}</SmartLink> : <div className={row}>{inner(i, href)}</div>}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

function Workshops({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title);
  if (items.length === 0 && !configText(c, "empty_text") && !configText(c, "heading")) return null;
  return (
    <section>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "intro") && <p className="text-lg text-gray-600">{configText(c, "intro")}</p>}
        </div>
        {items.length > 0 ? (
          <ul className="space-y-4">
            {items.map((i, n) => (
              <li key={n} className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                <div className="min-w-0 flex-1 space-y-2">
                  {i.when && <p className="inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>{i.when}</p>}
                  <h3 className="text-xl font-semibold text-gray-900">{i.title}</h3>
                  {i.where && <p className="flex items-center gap-1.5 text-sm text-gray-500"><Icon name="map-pin" className="h-4 w-4" />{i.where}</p>}
                  {i.text && <p className="leading-relaxed text-gray-600">{i.text}</p>}
                </div>
                {i.link && (
                  <SmartLink href={i.link} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-85" style={{ backgroundColor: THEME }}>
                    Sign up <Icon name="arrow-right" className="h-4 w-4" />
                  </SmartLink>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-gray-50 px-6 py-8 text-center text-gray-600">{configText(c, "empty_text")}</p>
        )}
      </div>
    </section>
  );
}

// Only YouTube and Vimeo embed URLs get here (checked on save), shown through their privacy-friendly domains.
function Video({ block, preview }: { block: HomeBlock; preview?: boolean }) {
  const c = block.config;
  const src = configText(c, "video");
  if (!src) return null;
  return (
    <section>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "intro") && <p className="text-lg text-gray-600">{configText(c, "intro")}</p>}
        </div>
        {preview ? <EmbedPlaceholder icon="video" label="Your video plays here" className="aspect-video w-full rounded-3xl" /> : <iframe
          title={configText(c, "heading") || "Video"}
          src={src}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-3xl border-0 bg-gray-100 shadow-lg"
        />}
      </div>
    </section>
  );
}

function GalleryBlock({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const photos = configList(c).flatMap((i) => {
    const url = urlOf(urls, i.photo_path);
    return url ? [{ url, caption: i.caption ?? "" }] : [];
  });
  if (photos.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        <Gallery photos={photos} columns={configText(c, "columns") === "4" ? 4 : 3} />
      </div>
    </section>
  );
}

function Glossary({ block }: { block: HomeBlock }) {
  const c = block.config;
  const filtered = configList(c).filter((i) => i.term);
  const items = configText(c, "sort") === "mine" ? filtered : [...filtered].sort((a, b) => a.term.localeCompare(b.term));
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "intro") && <p className="text-lg text-gray-600">{configText(c, "intro")}</p>}
        </div>
        <dl className="grid gap-4 md:grid-cols-2">
          {items.map((i, n) => (
            <div key={n} className="space-y-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
              <dt className="text-lg font-semibold" style={{ color: THEME }}>{i.term}</dt>
              {i.definition && <dd className="leading-relaxed text-gray-600">{i.definition}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function RichText({ block }: { block: HomeBlock }) {
  const c = block.config;
  const center = configText(c, "align") === "center";
  return (
    <section className={configText(c, "background") === "tint" ? "bg-gray-50" : ""}>
      <div className={`mx-auto max-w-3xl space-y-4 px-6 py-14 ${center ? "text-center" : ""}`}>
        {configText(c, "heading") && <h2 className="text-3xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
        <div className={`rich text-lg leading-relaxed text-gray-700 ${center ? "[&_ol]:inline-block [&_ul]:inline-block [&_ol]:text-left [&_ul]:text-left" : ""}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(configText(c, "body")) }} />
      </div>
    </section>
  );
}

function Compliance({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  return (
    <section className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        {configText(c, "heading") && <h2 className="text-lg font-semibold text-gray-900">{configText(c, "heading")}</h2>}
        <ul className="grid gap-6 md:grid-cols-3">
          {items.map((i, n) => (
            <li key={n} className="space-y-1.5 text-sm leading-relaxed text-gray-600">
              {i.title && <h3 className="font-semibold text-gray-800">{i.title}</h3>}
              {i.text && <p className="whitespace-pre-line">{i.text}</p>}
              {i.link && <SmartLink href={i.link} className="inline-flex items-center gap-1 font-medium underline underline-offset-4" style={{ color: THEME }}>Read the full notice</SmartLink>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Safety information, so it uses fixed warm red regardless of theme color.
function Crisis({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name);
  if (items.length === 0) return null;
  return (
    <section className="border-y border-red-100 bg-red-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
        <div className="space-y-2 text-center">
          {configText(c, "heading") && <h2 className="text-2xl font-semibold text-red-900 sm:text-3xl">{configText(c, "heading")}</h2>}
          {configText(c, "intro") && <p className="text-lg text-red-900/80">{configText(c, "intro")}</p>}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((i, n) => (
            <li key={n} className="space-y-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-100">
              <h3 className="font-semibold text-gray-900">{i.name}</h3>
              {i.phone && (
                <a href={`tel:${i.phone.replace(/[^+0-9]/g, "")}`} className="flex items-center gap-2 text-2xl font-bold text-red-700 underline-offset-4 hover:underline">
                  <Icon name="phone" className="h-5 w-5" />{i.phone}
                </a>
              )}
              {i.text && <p className="text-gray-600">{i.text}</p>}
              {i.link && <SmartLink href={i.link} className="inline-flex items-center gap-1 text-sm font-medium text-red-700 underline underline-offset-4">Website <Icon name="arrow-right" className="h-3.5 w-3.5" /></SmartLink>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Reviews({ block }: { block: HomeBlock }) {
  const c = block.config;
  const rating = parseFloat(configText(c, "rating"));
  const count = configText(c, "count");
  const source = configText(c, "source");
  const link = configText(c, "link");
  if (Number.isNaN(rating) && !count) return null;
  const filled = Number.isNaN(rating) ? 0 : Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-900/5">
          {configText(c, "heading") && <h2 className="text-2xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
          {!Number.isNaN(rating) && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-bold text-gray-900">{configText(c, "rating")}</span>
              <span className="flex" role="img" aria-label={`${rating} out of 5 stars`}>
                {[0, 1, 2, 3, 4].map((n) => <span key={n} style={{ color: n < filled ? "#f59e0b" : "#d1d5db" }}><Icon name="star" className="h-7 w-7 fill-current" /></span>)}
              </span>
            </div>
          )}
          {(count || source) && <p className="text-gray-600">{count ? `Based on ${count} ${source ? `${source} ` : ""}reviews` : `${source} reviews`}</p>}
          {link && (
            <div className="pt-1">
              <SmartLink href={link} className={buttonBase} style={{ backgroundColor: THEME, color: "#fff" }}>{configText(c, "link_label") || "Read our reviews"}</SmartLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Compare({ block }: { block: HomeBlock }) {
  const c = block.config;
  const us = configList(c, "us_items").filter((i) => i.text);
  const other = configList(c, "other_items").filter((i) => i.text);
  if (us.length === 0 && other.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <div className={`grid gap-5 ${us.length > 0 && other.length > 0 ? "md:grid-cols-2" : "mx-auto max-w-xl"}`}>
          {us.length > 0 && (
            <div className="space-y-4 rounded-3xl p-7 ring-2" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 7%, white)`, ["--tw-ring-color" as string]: THEME }}>
              <h3 className="text-xl font-semibold" style={{ color: THEME }}>{configText(c, "us_label")}</h3>
              <ul className="space-y-3">
                {us.map((i, n) => (
                  <li key={n} className="flex items-start gap-3 text-gray-800">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: THEME }}><Icon name="check" className="h-3.5 w-3.5" /></span>
                    {i.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {other.length > 0 && (
            <div className="space-y-4 rounded-3xl bg-gray-50 p-7 ring-1 ring-gray-900/5">
              <h3 className="text-xl font-semibold text-gray-600">{configText(c, "other_label")}</h3>
              <ul className="space-y-3">
                {other.map((i, n) => (
                  <li key={n} className="flex items-start gap-3 text-gray-600">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-300 text-white"><Icon name="x" className="h-3.5 w-3.5" /></span>
                    {i.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Promises({ block }: { block: HomeBlock }) {
  const items = configList(block.config).filter((i) => i.title);
  if (items.length === 0) return null;
  return (
    <section style={{ backgroundColor: `color-mix(in srgb, ${THEME} 8%, white)` }}>
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6">
        {items.map((i, n) => (
          <li key={n} className="flex items-center gap-3">
            {i.icon && <span style={{ color: THEME }}><LibraryIcon name={i.icon} className="h-7 w-7" /></span>}
            <span>
              <span className="block font-semibold text-gray-900">{i.title}</span>
              {i.text && <span className="block text-sm text-gray-600">{i.text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Referral({ block }: { block: HomeBlock }) {
  const c = block.config;
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:p-10" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 8%, white)` }}>
          <span {...iconCircle("h-16 w-16")}><LibraryIcon name="stethoscope" className="h-8 w-8" /></span>
          <div className="flex-1 space-y-2">
            {configText(c, "heading") && <h2 className="text-2xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
            {configText(c, "text") && <p className="text-lg leading-relaxed text-gray-700">{configText(c, "text")}</p>}
          </div>
          <Buttons c={c} />
        </div>
      </div>
    </section>
  );
}

function Timeline({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title || i.text);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-14">
        <SectionHead c={c} />
        <ol>
          {items.map((i, n) => (
            <li key={n} className="relative grid gap-x-6 pb-10 last:pb-0 sm:grid-cols-[8rem_1fr]">
              <p className="pb-1 font-semibold sm:pt-0.5 sm:text-right" style={{ color: THEME }}>{i.time}</p>
              <div className="relative border-l-2 border-gray-200 pl-6 sm:ml-0">
                <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white" style={{ backgroundColor: THEME }} />
                {i.title && <h3 className="text-lg font-semibold text-gray-900">{i.title}</h3>}
                {i.text && <p className="mt-1 leading-relaxed text-gray-600">{i.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Portal({ block }: { block: HomeBlock }) {
  const c = block.config;
  if (!configText(c, "primary_link")) return null;
  return (
    <section>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-5 px-6 py-8">
        <div className="flex items-center gap-4">
          <span {...iconCircle("h-12 w-12")}><LibraryIcon name="lock" className="h-6 w-6" /></span>
          <div>
            {configText(c, "heading") && <p className="text-lg font-semibold text-gray-900">{configText(c, "heading")}</p>}
            {configText(c, "text") && <p className="text-gray-600">{configText(c, "text")}</p>}
          </div>
        </div>
        <Buttons c={c} />
      </div>
    </section>
  );
}

function Downloads({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.title);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-14">
        <SectionHead c={c} />
        <ul className="space-y-3">
          {items.map((i, n) => {
            const href = docHref(i, urls);
            return (
            <li key={n} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
              <span {...iconCircle("h-12 w-12")}><Icon name="file-text" className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-900">{i.title}</p>
                {i.text && <p className="text-gray-600">{i.text}</p>}
              </div>
              {href && (
                <SmartLink href={href} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-sm transition hover:opacity-85" style={{ backgroundColor: THEME }}>
                  <LibraryIcon name="download" className="h-4 w-4" /> Download
                </SmartLink>
              )}
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Access({ block }: { block: HomeBlock }) {
  const c = block.config;
  const languages = configText(c, "languages").split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const access = configText(c, "access").split("\n").map((l) => l.trim()).filter(Boolean);
  if (languages.length === 0 && access.length === 0) return null;
  return (
    <section>
      <div className={`mx-auto grid max-w-5xl gap-6 px-6 py-14 ${languages.length > 0 && access.length > 0 ? "md:grid-cols-2" : "max-w-xl"}`}>
        {languages.length > 0 && (
          <div className="space-y-4 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900"><span style={{ color: THEME }}><LibraryIcon name="world" className="h-6 w-6" /></span>{configText(c, "languages_heading") || "Languages"}</h3>
            <ul className="flex flex-wrap gap-2">
              {languages.map((l) => <li key={l} className="rounded-full px-3.5 py-1 font-medium" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>{l}</li>)}
            </ul>
          </div>
        )}
        {access.length > 0 && (
          <div className="space-y-4 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-900/5">
            <h3 className="text-xl font-semibold text-gray-900">{configText(c, "access_heading") || "Accessibility"}</h3>
            <ul className="space-y-2.5">
              {access.map((a) => (
                <li key={a} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: THEME }}><Icon name="check" className="h-3.5 w-3.5" /></span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Spacer({ block }: { block: HomeBlock }) {
  const c = block.config;
  const space = { sm: "py-4", md: "py-10", lg: "py-20" }[configText(c, "size") as "sm"] ?? "py-10";
  return (
    <div aria-hidden className={space}>
      {configText(c, "line") === "line" && <hr className="mx-auto max-w-6xl border-gray-200" />}
    </div>
  );
}

function TwoColumns({ block }: { block: HomeBlock }) {
  const c = block.config;
  const col = (head: string, body: string) =>
    head || body ? (
      <div className="space-y-3">
        {head && <h3 className="text-2xl font-semibold" style={{ color: THEME }}>{head}</h3>}
        <div className="rich text-lg leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }} />
      </div>
    ) : null;
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        {configText(c, "heading") && <h2 className="text-center text-3xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
        <div className="grid gap-10 md:grid-cols-2">
          {col(configText(c, "left_heading"), configText(c, "left_body"))}
          {col(configText(c, "right_heading"), configText(c, "right_body"))}
        </div>
      </div>
    </section>
  );
}

function Banner({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const image = urlOf(urls, configText(c, "image_path"));
  if (!image) return null;
  const height = { sm: "h-48 sm:h-64", md: "h-64 sm:h-96", lg: "h-80 sm:h-[32rem]" }[configText(c, "height") as "sm"] ?? "h-64 sm:h-96";
  return (
    <section className={`relative w-full overflow-hidden ${height}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
      <img src={image} alt={configText(c, "caption")} loading="lazy" className="h-full w-full object-cover" />
      {configText(c, "caption") && (
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-6 pb-5 pt-16 text-lg font-medium text-white sm:px-10 sm:text-xl">{configText(c, "caption")}</p>
      )}
    </section>
  );
}

function Social({ block }: { block: HomeBlock }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.link && i.icon);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mx-auto max-w-4xl space-y-5 px-6 py-10 text-center">
        {configText(c, "heading") && <h2 className="text-xl font-semibold text-gray-900">{configText(c, "heading")}</h2>}
        <ul className="flex flex-wrap justify-center gap-3">
          {items.map((i, n) => (
            <li key={n}>
              <SmartLink href={i.link} className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-85" style={{ backgroundColor: THEME }}>
                <span className="sr-only">{i.label || i.icon}</span>
                <LibraryIcon name={i.icon} className="h-6 w-6" />
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MapOnly({ block, preview }: { block: HomeBlock; preview?: boolean }) {
  const c = block.config;
  const address = configText(c, "address");
  if (!address) return null;
  const height = { sm: "h-64", md: "h-96", lg: "h-[32rem]" }[configText(c, "height") as "sm"] ?? "h-96";
  return (
    <section>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        {configText(c, "heading") && <h2 className="text-center text-2xl font-semibold" style={{ color: THEME }}>{configText(c, "heading")}</h2>}
        {preview ? <EmbedPlaceholder icon="map-pin" label="Your map appears here" className={`${height} w-full rounded-3xl`} /> : <iframe
          title={`Map of ${address}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={`${height} w-full rounded-3xl border-0 bg-gray-100 shadow-sm`}
        />}
      </div>
    </section>
  );
}

export function BlockView({ block, urls, news, newsLabel, preview }: { block: HomeBlock; urls: Urls; news: NewsItem[]; newsLabel: string | null; preview?: boolean }) {
  switch (block.type) {
    case "hero": return <Hero block={block} urls={urls} />;
    case "hero_split": return <HeroSplit block={block} urls={urls} />;
    case "quick_actions": return <QuickActions block={block} />;
    case "partners":
    case "insurance": return <Insurance block={block} urls={urls} />;
    case "services": return <Services block={block} />;
    case "services_list": return <ServicesList block={block} urls={urls} />;
    case "settings": return <CareSettings block={block} />;
    case "ages": return <Ages block={block} />;
    case "image_text":
    case "approach": return <Approach block={block} urls={urls} />;
    case "values": return <Values block={block} />;
    case "steps": return <Steps block={block} />;
    case "faq": return <Faq block={block} />;
    case "first_day": return <FirstDay block={block} />;
    case "availability": return <Availability block={block} />;
    case "team": return <Team block={block} urls={urls} />;
    case "letter": return <Letter block={block} urls={urls} />;
    case "careers": return <Careers block={block} />;
    case "positions": return <Positions block={block} />;
    case "locations": return <Locations block={block} />;
    case "contact_form": return <ContactForm block={block} preview={preview} />;
    case "contact_info": return <ContactInfo block={block} />;
    case "cta": return <Cta block={block} />;
    case "news_feed": return <NewsFeed block={block} news={news} newsLabel={newsLabel} />;
    case "resources": return <Resources block={block} urls={urls} />;
    case "workshops": return <Workshops block={block} />;
    case "video": return <Video block={block} preview={preview} />;
    case "gallery": return <GalleryBlock block={block} urls={urls} />;
    case "glossary": return <Glossary block={block} />;
    case "rich_text": return <RichText block={block} />;
    case "compliance": return <Compliance block={block} />;
    case "crisis": return <Crisis block={block} />;
    case "reviews": return <Reviews block={block} />;
    case "compare": return <Compare block={block} />;
    case "promises": return <Promises block={block} />;
    case "roles": return <CareSettings block={block} />;
    case "referral": return <Referral block={block} />;
    case "funding": return <Services block={block} />;
    case "timeline": return <Timeline block={block} />;
    case "portal": return <Portal block={block} />;
    case "downloads": return <Downloads block={block} urls={urls} />;
    case "access": return <Access block={block} />;
    case "spacer": return <Spacer block={block} />;
    case "two_columns": return <TwoColumns block={block} />;
    case "banner": return <Banner block={block} urls={urls} />;
    case "social": return <Social block={block} />;
    case "map": return <MapOnly block={block} preview={preview} />;
    case "photos": return <Photos block={block} urls={urls} />;
    case "credentials": return <Credentials block={block} urls={urls} />;
    case "stats": return <Stats block={block} />;
    case "testimonials": return <Testimonials block={block} urls={urls} />;
    case "testimonial": return <Testimonial block={block} urls={urls} />;
    case "outcomes": return <Outcomes block={block} />;
    default: return null; // announcement renders in the layout, above the header
  }
}
