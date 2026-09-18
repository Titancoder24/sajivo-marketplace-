import { getActiveUser } from "@/lib/supabase/account-access";
import { NextResponse } from "next/server";
import { CITY_RATES, MATERIAL_FACTORS, QUALITY_FACTORS } from "@/lib/estimator";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({ rateVersion: "2026.08-mvp", cityRates: CITY_RATES, qualityFactors: QUALITY_FACTORS, materialFactors: MATERIAL_FACTORS });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("primary_role").eq("id", authData.user.id).single();
  if (profile?.primary_role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json();
  const { data, error } = await supabase.from("estimation_rate_versions").insert({ version: String(body.version ?? `rate-${Date.now()}`), city_rates: body.cityRates ?? {}, quality_factors: body.qualityFactors ?? {}, material_factors: body.materialFactors ?? {}, source: String(body.source ?? "Sajivo admin"), effective_date: body.effectiveDate ?? new Date().toISOString().slice(0, 10) }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rateVersion: data }, { status: 201 });
}
