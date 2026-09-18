import { getActiveUser } from "@/lib/supabase/account-access";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateEstimate } from "@/lib/estimator";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ city: z.string().min(2).max(100), propertyType: z.string().min(2).max(80), projectType: z.string().min(2).max(40), areaSqFt: z.number().min(100).max(100000), rooms: z.number().int().min(1).max(50), requirements: z.array(z.string().min(2).max(80)).max(30), quality: z.enum(["basic", "standard", "premium", "luxury"]), materialGrade: z.enum(["economy", "standard", "premium", "brands"]), timeline: z.enum(["flexible", "one_three", "three_six", "urgent"]), budgetMin: z.number().min(0).optional(), budgetMax: z.number().min(0).optional(), budgetUnknown: z.boolean() });
const schema = z.object({ inputs: inputSchema, estimate: z.unknown().optional() });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid estimator inputs" }, { status: 400 });
  const inputs = result.data.inputs;
  const estimate = calculateEstimate(inputs);
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Estimator persistence is unavailable because Supabase is not configured." }, { status: 503 });
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Sign in to save an estimate to your workspace." }, { status: 401 });
  const { data, error } = await supabase.from("project_estimates").insert({ customer_id: authData.user.id, inputs, minimum_estimate: estimate.minimum, maximum_estimate: estimate.maximum, confidence: estimate.confidence, budget_status: estimate.budgetStatus, breakdown: estimate.breakdown, rate_version: estimate.rateVersion }).select("id, minimum_estimate, maximum_estimate, confidence, budget_status, rate_version, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ estimate: data }, { status: 201 });
}
