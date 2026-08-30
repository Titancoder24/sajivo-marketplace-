import { NextResponse } from "next/server";
import { getAngelAuth } from "@/lib/server/angel";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const { data: conversation, error } = await auth.supabase
    .from("ai_support_conversations")
    .select("id, public_id, title, status, locale, project_id, last_message_at, created_at")
    .eq("id", id)
    .eq("account_id", auth.userId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const { data: messages, error: messageError } = await auth.supabase
    .from("ai_support_messages")
    .select("id, sender, content, citations, model, safety_flags, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 400 });
  return NextResponse.json({ conversation, messages: messages ?? [] });
}
