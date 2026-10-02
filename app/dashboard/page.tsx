import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dnsRecordsFor } from "@/lib/domain";
import { getAboutSections, getDirectors, logoUrl } from "@/lib/site";
import { logout } from "../login/actions";
import { AboutForm, AddDomainForm, DirectorsSettingsForm, FooterForm, HeaderStyleForm, LogoForm, MessageForm, RemoveDomainForm, SiteNameForm, VerifyForm } from "./forms";
import { buttonSecondary } from "./ui";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "domain", label: "Domain" },
  { key: "site", label: "Site" },
  { key: "about", label: "About" },
] as const;

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
  const aboutSections = site ? await getAboutSections(site.id) : [];
  const directors = site ? await getDirectors(site.id) : [];
  const logo = await logoUrl(site?.logo_path ?? null);

  // New sites land on Domain until it's verified; after that, on the content they'll edit most.
  const { tab: requested } = await searchParams;
  const tab = TABS.find((t) => t.key === requested)?.key ?? (site?.verified_at ? "site" : "domain");

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
            <nav className="inline-flex gap-1 rounded-xl bg-gray-200/60 p-1">
              {TABS.map((t) => (
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
                <Card title="Home page message" description="Shown on your home page.">
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

            {tab === "about" && (
              <>
                <Card title="About page" description="One page with a section for each part you fill in.">
                  <AboutForm enabled={site.about_enabled} label={site.about_label} sections={aboutSections} />
                </Card>
                <Card
                  title={site.directors_label}
                  description={`A section of your ${site.about_label} page.`}
                  aside={
                    <Link href="/dashboard/directors/new" className={buttonSecondary}>Add person</Link>
                  }
                >
                  {directors.length > 0 ? (
                    <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                      {directors.map((d) => (
                        <li key={d.id}>
                          <Link href={`/dashboard/directors/${d.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-sm text-gray-500">{d.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">No one added yet.</p>
                  )}
                  <div className="border-t border-gray-100 pt-5">
                    <DirectorsSettingsForm
                      enabled={site.directors_enabled}
                      label={site.directors_label}
                      layout={site.directors_layout}
                      shape={site.directors_photo_shape}
                    />
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
