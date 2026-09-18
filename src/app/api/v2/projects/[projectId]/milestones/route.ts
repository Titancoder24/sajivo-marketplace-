import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().date().nullable().optional(),
  amount: z.number().min(0).max(999999999).default(0),
});
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!z.string().uuid().safeParse(projectId).success)
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const { data: auth, error: authError } = await getActiveUser(supabase);
  if (authError || !auth.user)
    return NextResponse.json(
      { error: "Sign in to create milestones." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid milestone." },
      { status: 400 },
    );
  const { data: last } = await supabase
    .from("project_milestones")
    .select("sequence")
    .eq("project_id", projectId)
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
      amount: parsed.data.amount,
      sequence: (last?.sequence ?? 0) + 1,
      status: "planned",
    })
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ milestone: data }, { status: 201 });
}
