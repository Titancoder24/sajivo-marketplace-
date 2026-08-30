import { NextResponse } from "next/server";
import { getPlatformAdmin, normalizeMessage } from "@/lib/server/angel";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getPlatformAdmin("support_admin");
  if (!auth) return NextResponse.json({ error: "Support-admin access required" }, { status: 403 });
  const { id } = await context.params;
  const [{ data: conversation, error }, { data: messages, error: messageError }] = await Promise.all([
    auth.supabase.from("ai_support_conversations").select("id, public_id, title, status, locale, project_id, summary, last_message_at, account:profiles!account_id(full_name, account_public_id, email)").eq("id", id).maybeSingle(),
    auth.supabase.from("ai_support_messages").select("id, sender, sender_profile_id, content, citations, model, safety_flags, created_at").eq("conversation_id", id).order("created_at", { ascending: true }).limit(300),
  ]);
  if (error || messageError) return NextResponse.json({ error: error?.message ?? messageError?.message }, { status: 400 });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  return NextResponse.json({ conversation, messages: messages ?? [] });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getPlatformAdmin("support_admin");
  if (!auth) return NextResponse.json({ error: "Support-admin access required" }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const content = normalizeMessage(body.message);
  if (!content) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  const { data: conversation } = await auth.supabase.from("ai_support_conversations").select("id, account_id").eq("id", id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const { data, error } = await auth.supabase.from("ai_support_messages").insert({ conversation_id: id, sender: "admin", sender_profile_id: auth.userId, content }).select("id, sender, content, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await Promise.all([
    auth.supabase.from("ai_support_conversations").update({ status: "open", last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id),
    auth.supabase.from("ai_action_audit_logs").insert({ account_id: conversation.account_id, conversation_id: id, actor_id: auth.userId, actor_type: "admin", action: "support_admin_replied", risk_level: "low", outcome: "sent" }),
  ]);
  return NextResponse.json({ message: data }, { status: 201 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getPlatformAdmin("support_admin");
  if (!auth) return NextResponse.json({ error: "Support-admin access required" }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = ["open", "waiting_for_human", "resolved", "closed"].includes(body.status) ? body.status : null;
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const now = new Date().toISOString();
  const { error } = await auth.supabase.from("ai_support_conversations").update({ status, resolved_at: status === "resolved" ? now : null, updated_at: now }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
