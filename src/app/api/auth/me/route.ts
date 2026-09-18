import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveUser } from "@/lib/supabase/account-access";

export async function GET() {
  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await getActiveUser(supabase);
    if (error?.code === "account_suspended" || error?.code === "account_unavailable") return NextResponse.json({ profile: null, error: error.message }, { status: error.status });
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      return NextResponse.json({ profile });
    }
  }
  return NextResponse.json({ profile: null }, { status: 401 });
}
