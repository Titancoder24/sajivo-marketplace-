import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ phoneNumber: null, emailAddress: null });
  const { data } = await supabase.rpc("get_public_contact_settings");
  const settings = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    phoneNumber: settings?.phone_number ?? null,
    emailAddress: settings?.email_address ?? null,
  });
}
