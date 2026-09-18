import { getActiveUser } from "@/lib/supabase/account-access";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  bio: z.string().trim().max(1000).optional().default(""),
});

export async function PATCH(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues[0]?.message ?? "Enter valid profile details." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Profile service is unavailable." }, { status: 503 });
  const { data: auth } = await getActiveUser(supabase);
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.data.fullName,
      phone: input.data.phone || null,
      city: input.data.city || null,
      state: input.data.state || null,
      bio: input.data.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id)
    .select("id,full_name,email,phone,city,state,bio,account_status,verification_status,account_public_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
