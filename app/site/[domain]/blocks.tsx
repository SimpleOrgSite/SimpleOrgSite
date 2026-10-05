import Link from "next/link";
import { Icon, LibraryIcon } from "@/components/icons";
import { CountUp } from "./count-up";
import { PhotoCarousel } from "./photo-carousel";
import { sanitizeRichText } from "@/lib/richtext";
import { AVAILABILITY, configItems, configList, configText, libraryKey, type HomeBlock } from "@/lib/blocks";

type Urls = Record<string, string>;
// A row's own upload, or else the shared-library logo they picked.
const logoOf = (row: Record<string, string>, urls: Urls) => urlOf(urls, row.logo_path) ?? urlOf(urls, libraryKey(row.logo_lib));
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

export function BlockView({ block, urls }: { block: HomeBlock; urls: Urls }) {
  switch (block.type) {
    case "hero": return <Hero block={block} urls={urls} />;
    case "hero_split": return <HeroSplit block={block} urls={urls} />;
    case "quick_actions": return <QuickActions block={block} />;
    case "insurance": return <Insurance block={block} urls={urls} />;
    case "services": return <Services block={block} />;
    case "services_list": return <ServicesList block={block} urls={urls} />;
    case "settings": return <CareSettings block={block} />;
    case "ages": return <Ages block={block} />;
    case "approach": return <Approach block={block} urls={urls} />;
    case "values": return <Values block={block} />;
    case "steps": return <Steps block={block} />;
    case "faq": return <Faq block={block} />;
    case "first_day": return <FirstDay block={block} />;
    case "availability": return <Availability block={block} />;
    case "photos": return <Photos block={block} urls={urls} />;
    case "credentials": return <Credentials block={block} urls={urls} />;
    case "stats": return <Stats block={block} />;
    case "testimonials": return <Testimonials block={block} urls={urls} />;
    case "testimonial": return <Testimonial block={block} urls={urls} />;
    case "outcomes": return <Outcomes block={block} />;
    default: return null; // announcement renders in the layout, above the header
  }
}
