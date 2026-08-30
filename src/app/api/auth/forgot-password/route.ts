import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email() });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Password recovery is not configured." }, { status: 503 });

  const origin = new URL(request.url).origin;
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Keep the response generic so account existence cannot be enumerated.
  return NextResponse.json({ ok: true });
}
