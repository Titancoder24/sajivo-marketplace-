import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Enter valid administrator credentials." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Administrator authentication is unavailable." }, { status: 503 });

  const { data, error } = await supabase.auth.signInWithPassword(input.data);
  if (error || !data.user) return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("role,status")
    .eq("profile_id", data.user.id)
    .eq("role", "super_admin")
    .eq("status", "active")
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "This account does not have super-admin access." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
