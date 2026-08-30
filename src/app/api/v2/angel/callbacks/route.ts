import { NextResponse } from "next/server";
import { z } from "zod";
import { getAngelAuth } from "@/lib/server/angel";

const callbackSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  paymentId: z.string().uuid().optional().nullable(),
  reason: z.string().trim().min(5).max(2000),
  preferredDate: z.string().date(),
  timeWindow: z.string().trim().min(3).max(100),
  timezone: z.string().trim().min(3).max(100),
  communicationMethod: z.enum(["phone", "whatsapp", "email", "video"]),
});

export async function POST(request: Request) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = callbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete every callback field.", issues: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.preferredDate < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "Choose today or a future date." }, { status: 400 });

  if (parsed.data.conversationId) {
    const { data } = await auth.supabase.from("ai_support_conversations").select("id").eq("id", parsed.data.conversationId).eq("account_id", auth.userId).maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase.from("support_callback_requests").insert({
    account_id: auth.userId,
    conversation_id: parsed.data.conversationId ?? null,
    project_id: parsed.data.projectId ?? null,
    payment_id: parsed.data.paymentId ?? null,
    reason: parsed.data.reason,
    preferred_date: parsed.data.preferredDate,
    time_window: parsed.data.timeWindow,
    timezone: parsed.data.timezone,
    communication_method: parsed.data.communicationMethod,
  }).select("id, public_id, preferred_date, time_window, timezone, communication_method, status, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auth.supabase.from("ai_action_audit_logs").insert({ account_id: auth.userId, conversation_id: parsed.data.conversationId ?? null, actor_id: auth.userId, actor_type: "user", action: "support_callback_requested", risk_level: "low", outcome: "requested", metadata: { callback_public_id: data.public_id, method: data.communication_method } });
  return NextResponse.json({ callback: data }, { status: 201 });
}
