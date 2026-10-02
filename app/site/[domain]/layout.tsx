import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_MARKER } from "@/lib/domain";
import { logoHeight } from "@/lib/logo";
import { getAboutSections, isVisible, getDirectors, getSite, logoUrl } from "@/lib/site";

export default async function SiteLayout({ children, params }: LayoutProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();

  const logo = await logoUrl(site.logo_path);
  const dark = site.header_style === "dark";
  // About is one page; its dropdown jumps to each filled-in part of it.
  type NavItem = { href: string; label: string; children: { href: string; label: string }[] };
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
        className={dark ? "" : "border-b border-gray-200"}
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
          <nav className="flex items-center gap-8">
            {nav.map((item) => (
              <div key={item.href} className="group relative flex items-center gap-8">
                <Link href={item.href} className="flex items-center gap-1 text-current opacity-75 transition-opacity hover:opacity-100">
                  {item.label}
                  {item.children.length > 0 && (
                    // Tabler "chevron-down"; hints at the dropdown on desktop.
                    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current max-md:hidden" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M6 9l6 6l6 -6" />
                    </svg>
                  )}
                </Link>
                {/* Phones have no hover, so sub-pages sit inline there and drop down from md up. */}
                {item.children.map((c) => (
                  <Link key={c.href} href={c.href} className="text-current opacity-75 transition-opacity hover:opacity-100 md:hidden">{c.label}</Link>
                ))}
                {item.children.length > 0 && (
                  // The outer box is padded (not margined) so the pointer never crosses a gap that would close the menu.
                  // -left offset = panel padding + item padding, so item text lines up with the trigger text.
                  <div className="invisible absolute -left-[1.125rem] top-full z-10 translate-y-1 pt-3 opacity-0 transition duration-150 max-md:hidden group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <ul style={dark ? undefined : { color: site.theme_color }} className="w-max min-w-28 text-gray-700 rounded-2xl bg-white p-1.5 shadow-xl ring-1 shadow-gray-900/10 ring-gray-900/5">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-xl px-3 py-2 text-current opacity-80 transition hover:bg-gray-50 hover:opacity-100">{c.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
