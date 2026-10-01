import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_MARKER } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("id, message")
    .eq("domain", decodeURIComponent(domain).toLowerCase())
    .maybeSingle();
  if (!site) notFound();

  const marker = { [SITE_MARKER]: site.id };
  return (
    <main className="flex min-h-screen items-center justify-center p-8" {...marker}>
      <h1 className="text-4xl font-semibold text-center">{site.message}</h1>
    </main>
  );
}
