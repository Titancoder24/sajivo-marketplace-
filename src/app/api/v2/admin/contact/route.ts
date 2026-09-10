import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const schema = z.object({
  phoneNumber: z.string().trim().max(30).nullable(),
  emailAddress: z.string().trim().email().max(254).nullable(),
  showPhone: z.boolean(),
  showEmail: z.boolean(),
});

export async function GET() {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const { data, error } = await auth.supabase.from("platform_contact_settings").select("*").eq("singleton", true).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}

export async function PUT(request: Request) {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and contact settings." }, { status: 400 });
  if (parsed.data.showPhone && !parsed.data.phoneNumber) return NextResponse.json({ error: "A phone number is required when phone visibility is enabled." }, { status: 400 });
  if (parsed.data.showEmail && !parsed.data.emailAddress) return NextResponse.json({ error: "An email address is required when email visibility is enabled." }, { status: 400 });
  const { data, error } = await auth.supabase.from("platform_contact_settings").upsert({
    singleton: true,
    phone_number: parsed.data.phoneNumber || null,
    email_address: parsed.data.emailAddress || null,
    show_phone: parsed.data.showPhone,
    show_email: parsed.data.showEmail,
    updated_by: auth.userId,
    updated_at: new Date().toISOString(),
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
