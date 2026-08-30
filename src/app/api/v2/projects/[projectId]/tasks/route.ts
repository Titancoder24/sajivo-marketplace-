import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(2000).optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z
    .enum(["todo", "in_progress", "review", "done", "blocked", "cancelled"])
    .default("todo"),
  assigneeId: z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase)
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      ),
    };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    return {
      error: NextResponse.json(
        { error: "Sign in to manage project tasks." },
        { status: 401 },
      ),
    };
  return { supabase, user: data.user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await authenticatedClient();
  if ("error" in auth) return auth.error;
  const { projectId } = await params;
  if (!z.string().uuid().safeParse(projectId).success)
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("project_tasks")
    .select(
      "id, public_id, project_id, milestone_id, assignee_id, created_by, title, description, priority, status, due_at, completed_at, created_at, updated_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ tasks: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await authenticatedClient();
  if ("error" in auth) return auth.error;
  const { projectId } = await params;
  if (!z.string().uuid().safeParse(projectId).success)
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task." },
      { status: 400 },
    );

  const body = parsed.data;
  const { data, error } = await auth.supabase
    .from("project_tasks")
    .insert({
      project_id: projectId,
      created_by: auth.user.id,
      title: body.title,
      description: body.description || null,
      priority: body.priority,
      status: body.status,
      assignee_id: body.assigneeId ?? null,
      milestone_id: body.milestoneId ?? null,
      due_at: body.dueAt ?? null,
    })
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ task: data }, { status: 201 });
}
