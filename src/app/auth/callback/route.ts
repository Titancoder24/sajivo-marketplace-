import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next");
  const next = requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/";
  if (!code) return NextResponse.redirect(new URL("/login?error=invalid_auth_link", url.origin));
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?status=configuration_error", url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=expired_auth_link", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
