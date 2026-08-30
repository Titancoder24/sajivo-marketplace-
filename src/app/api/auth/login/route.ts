import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return NextResponse.json({ error: error?.message ?? "Invalid email or password" }, { status: 401 });
    const [{ data: profile, error: profileError }, { data: platformAdmin }] = await Promise.all([
      supabase.from("profiles").select("primary_role").eq("id", data.user.id).maybeSingle(),
      supabase.from("platform_admins").select("role, status").eq("profile_id", data.user.id).eq("status", "active").maybeSingle(),
    ]);
    if (platformAdmin) return NextResponse.json({ ok: true, role: "admin" });
    if (profileError || !profile) return NextResponse.json({ error: "Your Sajivo profile is not ready. Please contact support." }, { status: 503 });
    return NextResponse.json({ ok: true, role: profile.primary_role });
  }
  return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
}
