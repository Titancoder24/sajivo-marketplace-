import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const responseSchema = z.object({
  opportunityId: z.uuid(),
  action: z.enum(["interested", "declined"]),
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Opportunities are unavailable because Supabase is not configured." }, { status: 503 });
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data, error } = await supabase
    .from("opportunities")
    .select("id, public_id, status, response_deadline, viewed_at, created_at, requirement:requirements(id, public_id, title, project_type, location, budget, services, timeline)")
    .eq("professional_id", authData.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ opportunities: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const result = responseSchema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid response" }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Opportunities are unavailable because Supabase is not configured." }, { status: 503 });
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: result.data.action, responded_at: new Date().toISOString() })
    .eq("id", result.data.opportunityId)
    .eq("professional_id", authData.user.id)
    .select("id, public_id, status, responded_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ opportunity: data });
}
