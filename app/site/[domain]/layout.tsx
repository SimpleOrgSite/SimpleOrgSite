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
  const footerDark = (site.footer_match_header ? site.header_style : site.footer_style) === "dark";
  const showEmail = site.footer_show_email && !!site.footer_email;
  const hasFooter =
    (site.footer_show_logo && !!logo) || (site.footer_show_name && !!site.site_name) || site.footer_show_nav || site.footer_show_copyright || showEmail;
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
    <div className="flex min-h-screen flex-col bg-white text-gray-900" style={{ "--theme-color": site.theme_color } as React.CSSProperties} {...marker}>
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
      {hasFooter && (
        <footer
          className={footerDark ? "" : "border-t border-gray-200"}
          // Same rule as the header: dark = theme color background with white text; light = theme color text.
          style={footerDark ? { backgroundColor: site.theme_color, color: "#fff" } : { color: site.theme_color }}
        >
          <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
            {(site.footer_show_logo && logo) || site.footer_show_name || site.footer_show_nav ? (
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  {site.footer_show_logo && logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
                    <img src={logo} alt="" className="h-8 w-auto max-w-[50vw] object-contain" />
                  )}
                  {site.footer_show_name && site.site_name && <span className="text-lg font-semibold">{site.site_name}</span>}
                </div>
                {site.footer_show_nav && (
                  <nav className="flex flex-wrap gap-x-6 gap-y-2">
                    {nav.map((item) => (
                      <Link key={item.href} href={item.href} className="text-current opacity-75 transition-opacity hover:opacity-100">{item.label}</Link>
                    ))}
                  </nav>
                )}
              </div>
            ) : null}
            {(site.footer_show_copyright || showEmail) && (
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-sm opacity-75">
                <span>{site.footer_show_copyright && `© ${new Date().getFullYear()}${site.footer_show_name && site.site_name ? ` ${site.site_name}` : ""}`}</span>
                {showEmail && <a href={`mailto:${site.footer_email}`} className="underline-offset-4 hover:underline">{site.footer_email}</a>}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
