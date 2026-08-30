import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Subscriptions are unavailable because Supabase is not configured." }, { status: 503 });

  const [{ data: plans, error: planError }, { data: authData }] = await Promise.all([
    supabase.from("subscription_plans").select("id, slug, name, audience, billing_period, price, currency, entitlements, limits").eq("is_active", true).order("sort_order"),
    supabase.auth.getUser(),
  ]);
  if (planError) return NextResponse.json({ error: planError.message }, { status: 400 });

  if (!authData.user) return NextResponse.json({ plans: plans ?? [], subscription: null });
  const { data: subscription } = await supabase
    .from("account_subscriptions")
    .select("id, public_id, status, current_period_start, current_period_end, cancel_at_period_end, plan:subscription_plans(slug, name, entitlements, limits)")
    .eq("account_id", authData.user.id)
    .in("status", ["trialing", "active", "past_due", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ plans: plans ?? [], subscription: subscription ?? null });
}
