import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getActiveUser } from "./account-access";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPage = pathname.startsWith("/v2/") && pathname !== "/v2/" && pathname !== "/v2/register"
    || pathname.includes("/dashboard") || pathname === "/profile" || pathname === "/super-admin";
  const recoveryRoute = ["/api/auth/logout", "/api/auth/login", "/api/auth/admin-login", "/api/auth/forgot-password", "/api/auth/reset-password", "/auth/callback"].includes(pathname);
  const checkAccount = protectedPage || pathname.startsWith("/api/") && !recoveryRoute;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    if (checkAccount && pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    if (protectedPage) {
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
        Object.entries(headers ?? {}).forEach(([header, value]) => response.headers.set(header, value));
      },
    },
  });

  function preserveSession(target: NextResponse) {
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    target.headers.set("Cache-Control", "private, no-store");
    return target;
  }
  if (checkAccount) {
    const { data, error } = await getActiveUser(supabase);
    if (error?.code === "account_suspended" || error?.code === "account_unavailable") {
      if (pathname.startsWith("/api/")) return preserveSession(NextResponse.json({ error: error.message, code: error.code }, { status: error.status ?? 403 }));
      if (error.code === "account_unavailable") return preserveSession(new NextResponse("Account access could not be verified. Please retry.", { status: 503 }));
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = "";
      login.searchParams.set("status", "account_suspended");
      return preserveSession(NextResponse.redirect(login));
    }
    if (!data.user && protectedPage) {
      const login = request.nextUrl.clone();
      login.pathname = pathname.startsWith("/v2/admin") ? "/super-admin/login" : "/login";
      login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return preserveSession(NextResponse.redirect(login));
    }
  } else {
    await supabase.auth.getClaims();
  }
  return response;
}
