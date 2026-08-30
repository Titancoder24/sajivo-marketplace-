import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    if (request.nextUrl.pathname.startsWith("/v2/") || request.nextUrl.pathname.includes("/dashboard")) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("status", "configuration_error");
      return NextResponse.redirect(login);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([header, value]) => response.headers.set(header, value));
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const protectedV2 = pathname.startsWith("/v2/") && pathname !== "/v2/register";
  if (protectedV2) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const login = request.nextUrl.clone();
      login.pathname = pathname.startsWith("/v2/admin") ? "/super-admin/login" : "/login";
      login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  } else {
    await supabase.auth.getClaims();
  }
  return response;
}
