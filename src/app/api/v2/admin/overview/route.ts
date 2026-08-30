import { NextResponse } from "next/server";
import { getPlatformAdmin } from "@/lib/server/angel";

export async function GET() {
  const auth = await getPlatformAdmin();
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const [profiles, conversations, waiting, tickets, callbacks, usage, recentConversations, recentTickets, knowledge] = await Promise.all([
    auth.supabase.from("profiles").select("id", { count: "exact", head: true }),
    auth.supabase.from("ai_support_conversations").select("id", { count: "exact", head: true }),
    auth.supabase.from("ai_support_conversations").select("id", { count: "exact", head: true }).eq("status", "waiting_for_human"),
    auth.supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
    auth.supabase.from("support_callback_requests").select("id", { count: "exact", head: true }).in("status", ["requested", "confirmed"]),
    auth.supabase.from("ai_request_events").select("id", { count: "exact", head: true }).eq("outcome", "success").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    auth.supabase.from("ai_support_conversations").select("id, public_id, title, status, locale, last_message_at, account:profiles!account_id(full_name, account_public_id)").order("last_message_at", { ascending: false }).limit(12),
    auth.supabase.from("support_tickets").select("id, public_id, subject, status, priority, category, created_at, account:profiles!account_id(full_name, account_public_id)").order("updated_at", { ascending: false }).limit(12),
    auth.supabase.from("ai_knowledge_articles").select("id, slug, title, category, locale, summary, body, keywords, status, version, updated_at").order("category").order("title"),
  ]);

  const firstError = [profiles, conversations, waiting, tickets, callbacks, usage, recentConversations, recentTickets, knowledge].find((result) => result.error)?.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 400 });
  return NextResponse.json({
    admin: auth.admin,
    metrics: { profiles: profiles.count ?? 0, conversations: conversations.count ?? 0, waiting: waiting.count ?? 0, openTickets: tickets.count ?? 0, callbacks: callbacks.count ?? 0, aiRequests24h: usage.count ?? 0 },
    conversations: recentConversations.data ?? [],
    tickets: recentTickets.data ?? [],
    knowledge: knowledge.data ?? [],
  });
}
