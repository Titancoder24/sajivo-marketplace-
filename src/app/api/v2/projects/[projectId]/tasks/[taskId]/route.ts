import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(180).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z
      .enum(["todo", "in_progress", "review", "done", "blocked", "cancelled"])
      .optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    milestoneId: z.string().uuid().nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "No task changes supplied.",
  );

async function context(params: Promise<{ projectId: string; taskId: string }>) {
  const ids = await params;
  if (
    !z.string().uuid().safeParse(ids.projectId).success ||
    !z.string().uuid().safeParse(ids.taskId).success
  ) {
    return {
      error: NextResponse.json(
        { error: "Invalid task or project ID." },
        { status: 400 },
      ),
    };
  }
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
  return { ...ids, supabase };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const auth = await context(params);
  if ("error" in auth) return auth.error;
  const parsed = updateTaskSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task changes." },
      { status: 400 },
    );
  const body = parsed.data;
  const update = {
    updated_at: new Date().toISOString(),
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && {
      description: body.description || null,
    }),
    ...(body.priority !== undefined && { priority: body.priority }),
    ...(body.status !== undefined && {
      status: body.status,
      completed_at: body.status === "done" ? new Date().toISOString() : null,
    }),
    ...(body.assigneeId !== undefined && { assignee_id: body.assigneeId }),
    ...(body.milestoneId !== undefined && { milestone_id: body.milestoneId }),
    ...(body.dueAt !== undefined && { due_at: body.dueAt }),
  };
  const { data, error } = await auth.supabase
    .from("project_tasks")
    .update(update)
    .eq("id", auth.taskId)
    .eq("project_id", auth.projectId)
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  return NextResponse.json({ task: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const auth = await context(params);
  if ("error" in auth) return auth.error;
  const { error, count } = await auth.supabase
    .from("project_tasks")
    .delete({ count: "exact" })
    .eq("id", auth.taskId)
    .eq("project_id", auth.projectId);
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "42501" ? 403 : 400 },
    );
  if (!count)
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
