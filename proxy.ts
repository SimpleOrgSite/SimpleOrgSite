import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const platformHosts = (process.env.PLATFORM_HOSTS ?? "localhost")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // Customer domain: serve their site from the internal /site/[domain] route.
  if (!platformHosts.includes(host)) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${host}`;
    return NextResponse.rewrite(url);
  }

  // Platform host: keep the Supabase login session fresh.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
