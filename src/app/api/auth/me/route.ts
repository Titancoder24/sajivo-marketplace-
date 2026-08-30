import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.claims.sub).single();
      return NextResponse.json({ profile });
    }
  }
  return NextResponse.json({ profile: null }, { status: 401 });
}
