import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProjectsForRole } from "@/lib/server/repository";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

const projectSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(12).max(2000),
  scopeType: z.enum(["single_item", "single_room", "multi_room", "complete_property", "custom"]),
  scopeLabel: z.string().min(2).max(80),
  scopeSubtype: z.string().min(2).max(500),
  services: z.array(z.string().min(2)).min(1).max(20),
  city: z.string().trim().min(2).max(100),
  locality: z.string().trim().max(120).optional(),
  budgetRange: z.string().min(2).max(100),
  expectedTimeline: z.string().trim().min(2).max(120),
  fulfillmentPreference: z.enum(["independent_professional", "managed_execution", "help_me_decide"]).default("help_me_decide"),
  fileNames: z.array(z.string().max(255)).max(20).default([]),
  publish: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const role = (request.nextUrl.searchParams.get("role") ?? "customer") as UserRole;
  return NextResponse.json({ projects: await getProjectsForRole(role) });
}

export async function POST(request: NextRequest) {
  const result = projectSchema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid project brief" }, { status: 400 });
  const body = result.data;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Project storage is unavailable. Please try again later." }, { status: 503 });

  const { data: authData, error: authError } = await getActiveUser(supabase);
  if (authError || !authData.user) return NextResponse.json({ error: "Sign in with a client account to publish a project." }, { status: 401 });

  const projectInsert = {
    customer_id: authData.user.id,
    title: body.title,
    description: body.description,
    status: body.publish ? "published" : "draft",
    scope: { type: body.scopeType, label: body.scopeLabel, subtype: body.scopeSubtype },
    services: body.services,
    city: body.city,
    locality: body.locality,
    budget_range: body.budgetRange,
    expected_timeline: body.expectedTimeline,
    fulfillment_preference: body.fulfillmentPreference,
    preferences: { uploaded_file_names: body.fileNames },
    published_at: body.publish ? new Date().toISOString() : null,
  };
  let { data: project, error } = await supabase.from("projects").insert(projectInsert).select("*").single();
  if (error && /fulfillment_preference/i.test(error.message)) {
    if (body.fulfillmentPreference === "managed_execution") {
      return NextResponse.json({ error: "Sajivo Managed Execution is temporarily unavailable while its database migration is activated." }, { status: 503 });
    }
    const { fulfillment_preference: _pendingMigration, ...legacyInsert } = projectInsert;
    void _pendingMigration;
    ({ data: project, error } = await supabase.from("projects").insert(legacyInsert).select("*").single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!project) return NextResponse.json({ error: "Project could not be created." }, { status: 500 });

  if (body.fulfillmentPreference === "managed_execution") {
    const { error: managedError } = await supabase.from("managed_execution_cases").insert({
      project_id: project.id,
      customer_id: authData.user.id,
      acquisition_path: "customer_opt_in",
      eligibility_reason: "Customer requested Sajivo Managed Execution during project creation.",
    });
    if (managedError) {
      await supabase.from("projects").delete().eq("id", project.id).eq("customer_id", authData.user.id);
      return NextResponse.json({ error: managedError.message }, { status: 400 });
    }
  }
  return NextResponse.json({ project }, { status: 201 });
}
