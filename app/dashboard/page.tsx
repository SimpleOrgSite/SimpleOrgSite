import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dnsRecordsFor } from "@/lib/domain";
import { logoUrl, type SitePage } from "@/lib/site";
import { logout } from "../login/actions";
import { AddDomainForm, FooterForm, HeaderStyleForm, LogoForm, MessageForm, RemoveDomainForm, SiteNameForm, VerifyForm } from "./forms";
import { buttonSecondary } from "./ui";
import { NewsList } from "./news/news-list";
import { BlockList } from "./blocks/block-list";
import { PageSettingsForm, PagesList } from "./pages/page-forms";
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
    ? await supabase.from("pages").select("id, slug, title, is_home, show_in_menu, sort_order").eq("site_id", site.id).order("sort_order").order("created_at")
    : { data: null };
  // Home first, then the owner's order: the same order the site's menu uses.
  const pages: SitePage[] = [...(pageRows ?? [])].sort((a, b) => Number(b.is_home) - Number(a.is_home));
  const { data: newsRows } = site
    ? await supabase.from("news_items").select("id, name, story, link, tags, visible, published_on").eq("site_id", site.id).order("sort_order").order("created_at", { ascending: false })
    : { data: null };
  const logo = await logoUrl(site?.logo_path ?? null);

  // One tab per page, between Site and News. New sites land on Domain until it's verified; after that, on the Site tab.
  const tabs = [
    { key: "domain", label: "Domain" },
    { key: "site", label: "Site" },
    ...pages.map((p) => ({ key: `p-${p.id}`, label: p.title })),
    { key: "news", label: "News" },
  ];
  const { tab: requested, error: blockError } = await searchParams;
  // "home" is the old name of the Home page's tab, so old links keep working.
  const wanted = requested === "home" ? `p-${pages.find((p) => p.is_home)?.id}` : requested;
  const tab = tabs.find((t) => t.key === wanted)?.key ?? (site?.verified_at ? "site" : "domain");
  const page = pages.find((p) => tab === `p-${p.id}`);
  const { data: blockRows } = page
    ? await supabase.from("page_blocks").select("id, type, enabled, config").eq("page_id", page.id).order("sort_order").order("created_at")
    : { data: null };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
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
            <nav className="flex flex-wrap gap-1 rounded-xl bg-gray-200/60 p-1">
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  href={`/dashboard?tab=${t.key}`}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            {tab === "domain" && (
              <>
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
              </>
            )}

            {tab === "site" && (
              <>
                <Card title="Pages" description="Each page appears in your site's menu and gets its own tab above, where you add blocks to it.">
                  <PagesList pages={pages} />
                </Card>
                <Card title="Home page message" description="Shown on your home page until you turn on a block there.">
                  <MessageForm message={site.message} />
                </Card>
                <Card title="Logo" description="Appears at the top left of every page.">
                  <LogoForm logoUrl={logo} logoSize={site.logo_size} />
                </Card>
                <Card title="Site name" description="Shown in the header when you have no logo, or next to it if you choose.">
                  <SiteNameForm siteName={site.site_name} showWithLogo={site.show_name_with_logo} />
                </Card>
                <Card title="Header" description="Light or dark, and the theme color that goes with it.">
                  <HeaderStyleForm style={site.header_style} color={site.theme_color} siteName={site.site_name} showNameWithLogo={site.show_name_with_logo} logoUrl={logo} logoSize={site.logo_size} />
                </Card>
                <Card title="Footer" description="Shown at the bottom of every page.">
                  <FooterForm site={site} headerStyle={site.header_style} color={site.theme_color} siteName={site.site_name} logoUrl={logo} />
                </Card>
              </>
            )}

            {page && (
              <>
                <Card title="Blocks" description={page.is_home ? "Sections stacked top to bottom on your home page. With none turned on, your home page message is shown instead." : "Sections stacked top to bottom on this page."}>
                  {typeof blockError === "string" && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{blockError}</p>}
                  <BlockList blocks={(blockRows ?? []) as PageBlock[]} themeColor={site.theme_color} pageId={page.id} />
                </Card>
                <Card title="Page settings" description={page.is_home ? "Your home page." : `Lives at /${page.slug}`}>
                  <PageSettingsForm key={page.id} page={page} />
                </Card>
              </>
            )}

            {tab === "news" && (
              <Card
                title="Stories"
                description="The stories your News stories and Latest news blocks show. To display them, add one of those blocks to a page. Newest first by default; reorder with the arrows."
                aside={<Link href="/dashboard/news/new" className={buttonSecondary}>Add story</Link>}
              >
                <NewsList items={newsRows ?? []} />
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
