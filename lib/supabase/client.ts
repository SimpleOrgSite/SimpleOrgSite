import { createBrowserClient } from "@supabase/ssr";

// Browser-side client, used only for uploads: files go straight from the browser to Storage with the
// signed-in owner's session, so they never pass through a server action (which has small size limits).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
