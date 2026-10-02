import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dnsRecordsFor } from "@/lib/domain";
import { logoUrl } from "@/lib/site";
import { logout } from "../login/actions";
import { AboutForm, AddDomainForm, LogoForm, MessageForm, SiteNameForm, RemoveDomainForm, VerifyForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: site } = await supabase.from("sites").select("*").eq("owner_id", auth.user.id).maybeSingle();

  const logo = await logoUrl(site?.logo_path ?? null);

  return (
    <main className="mx-auto max-w-2xl space-y-10 p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Your site</h1>
        <form action={logout}>
          <button className="text-sm text-gray-500 underline">Log out ({auth.user.email})</button>
        </form>
      </header>

      {!site ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">1. Enter your domain</h2>
          <AddDomainForm />
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-medium">1. Point {site.domain} at us</h2>
            <p className="text-sm text-gray-600">Add this record at your DNS provider:</p>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b"><th className="py-1">Type</th><th>Name</th><th>Value</th></tr>
              </thead>
              <tbody>
                {dnsRecordsFor(site.domain).map((r) => (
                  <tr key={r.type} className="border-b font-mono">
                    <td className="py-1">{r.type}</td><td>{r.name}</td><td>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <RemoveDomainForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">2. Check it works</h2>
            {site.verified_at ? (
              <p className="text-green-700">
                Live: <a className="underline" href={`https://${site.domain}`} target="_blank">https://{site.domain}</a>
              </p>
            ) : (
              <p className="text-sm text-gray-600">Not verified yet.</p>
            )}
            <VerifyForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">3. Edit your message</h2>
            <MessageForm message={site.message} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">4. Header</h2>
            <p className="text-sm text-gray-600">Your logo appears at the top left of every page.</p>
            <LogoForm logoUrl={logo} logoSize={site.logo_size} />
            <SiteNameForm siteName={site.site_name} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">5. About Us</h2>
            <AboutForm enabled={site.about_enabled} content={site.about_content} />
          </section>
        </>
      )}
    </main>
  );
}
