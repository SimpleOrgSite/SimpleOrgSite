import Link from "next/link";
import { Icon, LibraryIcon } from "@/components/icons";
import { CountUp } from "./count-up";
import { configItems, configList, configText, type HomeBlock } from "@/lib/blocks";

type Urls = Record<string, string>;
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

// Logos when there is one, plain text otherwise, so a plan can be listed before its logo is uploaded.
function Insurance({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.logo_path);
  if (items.length === 0) return null;
  const link = configText(c, "link");
  return (
    <section>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
        <div className="space-y-2 text-center">
          {heading(configText(c, "heading"))}
          {configText(c, "subhead") && <p className="text-lg text-gray-600">{configText(c, "subhead")}</p>}
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {items.map((i, n) => {
            const logo = urlOf(urls, i.logo_path);
            return (
              <li key={n} className="flex h-12 items-center">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
                  <img src={logo} alt={i.name || ""} className="max-h-12 w-auto max-w-[9rem] object-contain" />
                ) : (
                  <span className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-700">{i.name}</span>
                )}
              </li>
            );
          })}
        </ul>
        {link && (
          <div className="text-center">
            <SmartLink href={link} className={buttonBase} style={{ backgroundColor: THEME, color: "#fff" }}>{configText(c, "link_label") || "Verify my coverage"}</SmartLink>
          </div>
        )}
      </div>
    </section>
  );
}

function Credentials({ block, urls }: { block: HomeBlock; urls: Urls }) {
  const c = block.config;
  const items = configList(c).filter((i) => i.name || i.logo_path);
  if (items.length === 0) return null;
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-14">
        {heading(configText(c, "heading"))}
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-8">
          {items.map((i, n) => {
            const badge = urlOf(urls, i.logo_path);
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

export function BlockView({ block, urls }: { block: HomeBlock; urls: Urls }) {
  switch (block.type) {
    case "hero": return <Hero block={block} urls={urls} />;
    case "hero_split": return <HeroSplit block={block} urls={urls} />;
    case "quick_actions": return <QuickActions block={block} />;
    case "insurance": return <Insurance block={block} urls={urls} />;
    case "credentials": return <Credentials block={block} urls={urls} />;
    case "stats": return <Stats block={block} />;
    case "testimonials": return <Testimonials block={block} urls={urls} />;
    case "testimonial": return <Testimonial block={block} urls={urls} />;
    case "outcomes": return <Outcomes block={block} />;
    default: return null; // announcement renders in the layout, above the header
  }
}
