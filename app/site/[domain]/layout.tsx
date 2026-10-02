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
  // Sections show up here only when the owner has switched them on.
  const nav = [site.about_enabled && { href: "/about", label: "About Us" }].filter(Boolean) as { href: string; label: string }[];

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
              <Link key={item.href} href={item.href} className="text-gray-600 hover:text-gray-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
