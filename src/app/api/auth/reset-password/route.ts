import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/\d/, "Password must contain a number").regex(/[^A-Za-z0-9]/, "Password must contain a symbol"),
});

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid password" }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Password recovery is not configured." }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 401 });

  const { error } = await supabase.auth.updateUser({ password: result.data.password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
