import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_MARKER } from "@/lib/domain";
import { logoHeight } from "@/lib/logo";
import { getSite, logoUrl } from "@/lib/site";

export default async function SiteLayout({ children, params }: LayoutProps<"/site/[domain]">) {
  const { domain } = await params;
  const site = await getSite(domain);
  if (!site) notFound();

  const logo = await logoUrl(site.logo_path);
  // Sections show up here only when the owner has switched them on. Directors lives under About,
  // so it needs About enabled too.
  type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };
  const directors = site.about_enabled && site.directors_enabled && { href: "/about/directors", label: site.directors_label || "Directors" };
  const nav: NavItem[] = [
    site.about_enabled && { href: "/about", label: site.about_label || "About Us", children: directors ? [directors] : [] },
  ].filter(Boolean) as NavItem[];

  // The marker lives in the layout so every page proves it was served by us.
  const marker = { [SITE_MARKER]: site.id };
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900" {...marker}>
      <header className="border-b border-gray-200">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center py-3 justify-between gap-6 px-6">
          <Link href="/" className="flex items-center">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
              <img src={logo} alt={site.site_name || "Home"} style={{ height: logoHeight(site.logo_size) }} className="w-auto max-w-[60vw] object-contain" />
            ) : (
              <span className="text-xl font-bold">{site.site_name || "Home"}</span>
            )}
          </Link>
          <nav className="flex items-center gap-8">
            {nav.map((item) => (
              <div key={item.href} className="group relative flex items-center gap-8">
                <Link href={item.href} className="text-gray-600 hover:text-gray-900">{item.label}</Link>
                {/* Phones have no hover, so sub-pages sit inline there and drop down from md up. */}
                {item.children?.map((c) => (
                  <Link key={c.href} href={c.href} className="text-gray-600 hover:text-gray-900 md:hidden">{c.label}</Link>
                ))}
                {!!item.children?.length && (
                  <ul className="absolute right-0 top-full z-10 hidden min-w-40 rounded-md border border-gray-200 bg-white py-2 shadow-sm md:group-hover:block md:group-focus-within:block">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block px-4 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900">{c.label}</Link>
                      </li>
                    ))}
                  </ul>
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
