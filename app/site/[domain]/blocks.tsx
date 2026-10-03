import Link from "next/link";
import { Icon } from "@/components/icons";
import { configItems, configText, type HomeBlock } from "@/lib/blocks";

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

function Hero({ block, imageUrl }: { block: HomeBlock; imageUrl: string | null }) {
  const c = block.config;
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

function HeroSplit({ block, imageUrl }: { block: HomeBlock; imageUrl: string | null }) {
  const c = block.config;
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
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${THEME} 12%, white)`, color: THEME }}>
        <Icon name={i.icon} className="h-6 w-6" />
      </span>
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

export function BlockView({ block, imageUrl }: { block: HomeBlock; imageUrl: string | null }) {
  switch (block.type) {
    case "hero": return <Hero block={block} imageUrl={imageUrl} />;
    case "hero_split": return <HeroSplit block={block} imageUrl={imageUrl} />;
    case "quick_actions": return <QuickActions block={block} />;
    default: return null; // announcement renders in the layout, above the header
  }
}
