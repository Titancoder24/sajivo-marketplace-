import { NextResponse } from "next/server";
import { getAngelAuth, normalizeMessage } from "@/lib/server/angel";

export async function POST(request: Request) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const subject = normalizeMessage(body.subject || "Angel AI support handoff").slice(0, 180);
  if (!conversationId) return NextResponse.json({ error: "Conversation is required" }, { status: 400 });
  const { data: conversation } = await auth.supabase
    .from("ai_support_conversations")
    .select("id, public_id, project_id")
    .eq("id", conversationId)
    .eq("account_id", auth.userId)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const { data: messages } = await auth.supabase.from("ai_support_messages").select("sender, content, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(12);
  const { data: ticket, error } = await auth.supabase.from("support_tickets").insert({
    account_id: auth.userId,
    project_id: conversation.project_id,
    conversation_id: conversationId,
    subject,
    category: "angel_handoff",
    priority: body.priority === "urgent" ? "urgent" : "normal",
    messages: [...(messages ?? [])].reverse(),
  }).select("id, public_id, subject, status, priority, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await Promise.all([
    auth.supabase.from("ai_support_conversations").update({ status: "waiting_for_human", escalated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversationId),
    auth.supabase.from("ai_action_audit_logs").insert({ account_id: auth.userId, conversation_id: conversationId, actor_id: auth.userId, actor_type: "user", action: "human_support_requested", risk_level: "medium", outcome: "ticket_created", metadata: { ticket_public_id: ticket.public_id } }),
  ]);
  return NextResponse.json({ ticket }, { status: 201 });
}
