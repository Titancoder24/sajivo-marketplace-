import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";
import { encryptIntegrationValue } from "@/lib/server/integrations";

const schema = z.object({
  provider: z.enum(["openrouter", "google_analytics", "microsoft_clarity", "google_search_console", "razorpay", "resend", "twilio"]),
  secret: z.string().trim().min(8).max(10000),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function GET() {
  const auth = await getPlatformAdmin();
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const { data, error } = await auth.supabase.from("platform_integrations").select("id, provider, value_hint, status, config, last_verified_at, updated_at").order("provider");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ integrations: data ?? [] });
}

export async function PUT(request: Request) {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provider and API key are required." }, { status: 400 });
  const encrypted = encryptIntegrationValue(parsed.data.secret);
  const { data, error } = await auth.supabase.from("platform_integrations").upsert({
    provider: parsed.data.provider,
    encrypted_value: encrypted.encryptedValue,
    encryption_iv: encrypted.iv,
    encryption_tag: encrypted.tag,
    value_hint: encrypted.hint,
    status: "configured",
    config: parsed.data.config ?? {},
    updated_by: auth.userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider" }).select("id, provider, value_hint, status, config, updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auth.supabase.from("ai_action_audit_logs").insert({ actor_id: auth.userId, actor_type: "admin", action: "platform_integration_updated", risk_level: "high", outcome: "configured", metadata: { provider: parsed.data.provider } });
  return NextResponse.json({ integration: data });
}
