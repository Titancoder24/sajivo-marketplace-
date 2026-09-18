import { getActiveUser } from "@/lib/supabase/account-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requirementSchema = z.object({
  title: z.string().trim().min(3).max(140),
  projectType: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(100),
  locality: z.string().trim().max(120).optional(),
  budgetMinimum: z.number().nonnegative(),
  budgetMaximum: z.number().positive(),
  stylePreferences: z.array(z.string().trim().min(2).max(80)).max(12).default([]),
  services: z.array(z.string().trim().min(2).max(100)).min(1).max(24),
  timeline: z.object({
    preferredStart: z.string().optional(),
    expectedDuration: z.string().trim().min(2).max(100),
  }),
  description: z.string().trim().min(12).max(4000),
  publish: z.boolean().default(false),
}).refine((value) => value.budgetMaximum >= value.budgetMinimum, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budgetMaximum"],
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Requirements are unavailable because Supabase is not configured." }, { status: 503 });
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data, error } = await supabase
    .from("requirements")
    .select("id, public_id, title, project_type, location, budget, services, timeline, ai_summary, status, published_at, created_at")
    .eq("customer_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ requirements: data ?? [] });
}

export async function POST(request: NextRequest) {
  const result = requirementSchema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid requirement" }, { status: 400 });

  const body = result.data;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Requirements are unavailable because Supabase is not configured." }, { status: 503 });

  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Sign in with a customer account to create a requirement." }, { status: 401 });

  const structuredBrief = {
    description: body.description,
    objectives: [],
    constraints: [],
    source: "sajivo-v2",
  };
  const { data, error } = await supabase.from("requirements").insert({
    customer_id: authData.user.id,
    title: body.title,
    project_type: body.projectType,
    location: { city: body.city, locality: body.locality ?? null },
    budget: { minimum: body.budgetMinimum, maximum: body.budgetMaximum, currency: "INR" },
    style_preferences: body.stylePreferences,
    services: body.services,
    timeline: body.timeline,
    structured_brief: structuredBrief,
    status: body.publish ? "published" : "draft",
    published_at: body.publish ? new Date().toISOString() : null,
  }).select("id, public_id, title, status, created_at").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ requirement: data }, { status: 201 });
}
