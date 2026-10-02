import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_MARKER } from "@/lib/domain";
import { logoHeight } from "@/lib/logo";
import { SiteNav, type NavItem } from "./site-nav";
import { getAboutSections, isVisible, getDirectors, getSite, logoUrl } from "@/lib/site";

export default async function SiteLayout({ children, params }: LayoutProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();

  const logo = await logoUrl(site.logo_path);
  const dark = site.header_style === "dark";
  // About is one page; its dropdown jumps to each filled-in part of it.
  // Home is always first: not everyone knows the logo is a link.
  const nav: NavItem[] = [{ href: "/", label: "Home", children: [] }];
  if (site.about_enabled) {
    const children = (await getAboutSections(site.id)).filter(isVisible).map((s) => ({ href: `/about#${s.anchor}`, label: s.title }));
    if (site.directors_enabled && (await getDirectors(site.id)).length > 0) {
      children.push({ href: "/about#directors", label: site.directors_label || "Directors" });
    }
    nav.push({ href: "/about", label: site.about_label || "About Us", children });
  }

  // The marker lives in the layout so every page proves it was served by us.
  const marker = { [SITE_MARKER]: site.id };
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900" {...marker}>
      <header
        className={`relative ${dark ? "" : "border-b border-gray-200"}`}
        // Dark: theme color is the background, text is white. Light: white background, text is the theme color.
        style={dark ? { backgroundColor: site.theme_color, color: "#fff" } : { color: site.theme_color }}
      >
        <div className="mx-auto flex min-h-16 max-w-6xl items-center py-3 justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-3">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
              <img src={logo} alt={site.show_name_with_logo && site.site_name ? "" : site.site_name || "Home"} style={{ height: logoHeight(site.logo_size) }} className="w-auto max-w-[60vw] object-contain" />
            )}
            {(!logo || site.show_name_with_logo) && <span className="text-xl font-bold">{site.site_name || "Home"}</span>}
          </Link>
          <SiteNav nav={nav} dark={dark} color={site.theme_color} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
