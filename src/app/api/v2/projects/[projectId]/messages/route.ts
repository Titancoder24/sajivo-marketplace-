import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const messageSchema = z.object({ text: z.string().trim().min(1).max(4000) });
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
        { error: "Sign in to use project chat." },
        { status: 401 },
      ),
    };
  return { supabase, user: data.user };
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const auth = await context(projectId);
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from("workspace_messages")
    .select("id, sender_id, text, created_at, edited_at")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ messages: data, currentUserId: auth.user.id });
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const auth = await context(projectId);
  if ("error" in auth) return auth.error;
  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 },
    );
  const { data, error } = await auth.supabase
    .from("workspace_messages")
    .insert({
      project_id: projectId,
      sender_id: auth.user.id,
      text: parsed.data.text,
    })
    .select("id, sender_id, text, created_at, edited_at")
    .single();
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ message: data }, { status: 201 });
}
