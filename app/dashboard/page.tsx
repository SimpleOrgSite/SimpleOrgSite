import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dnsRecordsFor } from "@/lib/domain";
import { orderPages, type SitePage } from "@/lib/pages";
import { logoUrl } from "@/lib/site";
import { logout } from "../login/actions";
import { AddDomainForm, FooterForm, HeaderStyleForm, LogoForm, RemoveDomainForm, SiteNameForm, VerifyForm } from "./forms";
import { buttonSecondary } from "./ui";
import { BlockList } from "./blocks/block-list";
import { PagePlacementForm, PageSettingsForm, PagesList } from "./pages/page-forms";
import type { PageBlock } from "@/lib/blocks";

export const dynamic = "force-dynamic";

function Card({ title, description, aside, children }: { title: string; description?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: site } = await supabase.from("sites").select("*").eq("owner_id", auth.user.id).maybeSingle();
  const { data: pageRows } = site
    ? await supabase.from("pages").select("*").eq("site_id", site.id).order("sort_order").order("created_at")
    : { data: null };
  // Home first, then each top-level page with its sub pages: the order of the site's menu. Inactive pages stay here so they can be edited.
  const pages: SitePage[] = orderPages(
    (pageRows ?? []).map((p) => ({ id: p.id, slug: p.slug, title: p.title, is_home: p.is_home, show_in_menu: p.show_in_menu, sort_order: p.sort_order, active: p.active !== false, parent_id: p.parent_id ?? null })),
  );
  const logo = await logoUrl(site?.logo_path ?? null);

  // One tab per page, after Domain, Site and Pages. New sites land on Domain until it's verified; after that, on the Site tab.
  const tabs = [
    { key: "domain", label: "Domain" },
    { key: "site", label: "Site" },
    { key: "pages", label: "Pages" },
  ];
  const pageTabs = pages.map((p) => ({ key: `p-${p.id}`, label: p.active ? p.title : `${p.title} (off)` }));
  const { tab: requested, error: blockError } = await searchParams;
  // "home" is the old name of the Home page's tab, so old links keep working.
  const wanted = requested === "home" ? `p-${pages.find((p) => p.is_home)?.id}` : requested;
  const tab = [...tabs, ...pageTabs].find((t) => t.key === wanted)?.key ?? (site?.verified_at ? "site" : "domain");
  const page = pages.find((p) => tab === `p-${p.id}`);
  const { data: blockRows } = page
    ? await supabase.from("page_blocks").select("id, type, enabled, config").eq("page_id", page.id).order("sort_order").order("created_at")
    : { data: null };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="mx-auto max-w-[1500px] space-y-6 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Your site</h1>
          <div className="flex items-center gap-4">
            {site?.verified_at && (
              <a href={`https://${site.domain}`} target="_blank" className={buttonSecondary}>
                View site ↗
              </a>
            )}
            <form action={logout}>
              <button className="text-sm text-gray-500 transition hover:text-gray-900" title={auth.user.email}>Log out</button>
            </form>
          </div>
        </header>

        {!site ? (
          <Card title="Enter your domain" description="The web address your site will live at.">
            <AddDomainForm />
          </Card>
        ) : (
          <>
            {/* The site's own tabs on gray; your pages on a soft blue, so they stand apart. */}
            <nav className="flex flex-wrap items-center gap-3">
              {[
                { items: tabs, group: "bg-gray-200/60", idle: "text-gray-500 hover:text-gray-900" },
                { items: pageTabs, group: "bg-sky-100/80", idle: "text-sky-800/70 hover:text-sky-950" },
              ].map(({ items, group, idle }) =>
                items.length > 0 && (
                  <div key={group} className={`flex flex-wrap gap-1 rounded-xl p-1 ${group}`}>
                    {items.map((t) => (
                      <Link
                        key={t.key}
                        href={`/dashboard?tab=${t.key}`}
                        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : idle}`}
                      >
                        {t.label}
                      </Link>
                    ))}
                  </div>
                ),
              )}
            </nav>

            {tab === "domain" && (
              <div className="max-w-3xl space-y-6">
                <Card
                  title={site.domain}
                  description="Add this record at your DNS provider, then check that it works."
                  aside={
                    site.verified_at ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20">Live</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">Not verified</span>
                    )
                  }
                >
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr><th className="px-4 py-2 font-medium">Type</th><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">Value</th></tr>
                      </thead>
                      <tbody>
                        {dnsRecordsFor(site.domain).map((r) => (
                          <tr key={r.type} className="border-t border-gray-200 font-mono">
                            <td className="px-4 py-2.5">{r.type}</td><td className="px-4 py-2.5">{r.name}</td><td className="px-4 py-2.5">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <VerifyForm />
                  <div className="border-t border-gray-100 pt-4">
                    <RemoveDomainForm />
                  </div>
                </Card>
              </div>
            )}

            {tab === "site" && (
              <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                <div className="space-y-6">
                  <Card title="Logo" description="Appears at the top left of every page.">
                    <LogoForm logoUrl={logo} logoSize={site.logo_size} />
                  </Card>
                  <Card title="Site name" description="Shown in the header when you have no logo, or next to it if you choose.">
                    <SiteNameForm siteName={site.site_name} showWithLogo={site.show_name_with_logo} />
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card title="Header" description="Light or dark, and the theme color that goes with it.">
                    <HeaderStyleForm style={site.header_style} color={site.theme_color} siteName={site.site_name} showNameWithLogo={site.show_name_with_logo} logoUrl={logo} logoSize={site.logo_size} />
                  </Card>
                  <Card title="Footer" description="Shown at the bottom of every page.">
                    <FooterForm site={site} headerStyle={site.header_style} color={site.theme_color} siteName={site.site_name} logoUrl={logo} />
                  </Card>
                </div>
              </div>
            )}

            {tab === "pages" && (
              <div className="max-w-4xl">
                <Card title="Pages" description="Each page appears in your site's menu and gets its own tab to the right, where you add blocks to it.">
                  <PagesList pages={pages} />
                </Card>
              </div>
            )}

            {page && (
              // Blocks take the wide column; the page's own settings sit beside them on large screens.
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
                <Card title="Blocks" description={page.is_home ? "Sections stacked top to bottom on your home page. With none turned on, visitors see a simple “Coming soon” page." : "Sections stacked top to bottom on this page."}>
                  {typeof blockError === "string" && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{blockError}</p>}
                  <BlockList blocks={(blockRows ?? []) as PageBlock[]} themeColor={site.theme_color} pageId={page.id} pages={pages.map((p) => ({ id: p.id, title: p.title }))} />
                </Card>
                <div className="space-y-6">
                  {!page.is_home && (
                    <Card title="Menu placement" description="Make this its own item in your site's menu, or tuck it into a dropdown under another page.">
                      <PagePlacementForm
                        key={page.id}
                        page={page}
                        parents={pages.filter((p) => !p.is_home && !p.parent_id && p.id !== page.id)}
                        hasSubPages={pages.some((p) => p.parent_id === page.id)}
                      />
                    </Card>
                  )}
                  <Card title="Page settings" description={page.is_home ? "Your home page." : `Lives at /${page.slug}`}>
                    <PageSettingsForm key={page.id} page={page} />
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
