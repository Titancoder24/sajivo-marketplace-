import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.string().trim().min(2).max(80),
});
async function context(projectId: string) {
  if (!z.string().uuid().safeParse(projectId).success)
    return {
      error: NextResponse.json(
        { error: "Invalid project ID." },
        { status: 400 },
      ),
    };
  const supabase = await createClient();
  if (!supabase)
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      ),
    };
  const { data, error } = await getActiveUser(supabase);
  if (error || !data.user)
    return {
      error: NextResponse.json(
        { error: "Sign in to manage the project team." },
        { status: 401 },
      ),
    };
  return { supabase };
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const auth = await context(projectId);
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from("project_team_members")
    .select(
      "id, profile_id, role, permissions, status, joined_at, created_at, profile:profiles!project_team_members_profile_id_fkey(full_name,email,primary_role)",
    )
    .eq("project_id", projectId)
    .neq("status", "removed")
    .order("created_at");
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ members: data });
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const auth = await context(projectId);
  if ("error" in auth) return auth.error;
  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid invitation." },
      { status: 400 },
    );
  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("id,full_name,email,primary_role")
    .ilike("email", parsed.data.email)
    .maybeSingle();
  if (profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  if (!profile)
    return NextResponse.json(
      { error: "No active Sajivo account was found for that email." },
      { status: 404 },
    );
  const { data, error } = await auth.supabase
    .from("project_team_members")
    .upsert(
      {
        project_id: projectId,
        profile_id: profile.id,
        role: parsed.data.role,
        status: "invited",
      },
      { onConflict: "project_id,profile_id" },
    )
    .select("id, profile_id, role, permissions, status, joined_at, created_at")
    .single();
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ member: { ...data, profile } }, { status: 201 });
}
