import { NextResponse } from "next/server";
import { getAngelAuth, normalizeMessage } from "@/lib/server/angel";

export async function GET() {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await auth.supabase
    .from("ai_support_conversations")
    .select("id, public_id, title, status, locale, project_id, last_message_at, created_at")
    .eq("account_id", auth.userId)
    .order("last_message_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const title = normalizeMessage(body.title || "Angel support conversation").slice(0, 120);
  const locale = body.locale === "hi" ? "hi" : "en";
  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const { data, error } = await auth.supabase
    .from("ai_support_conversations")
    .insert({ account_id: auth.userId, title, locale, project_id: projectId })
    .select("id, public_id, title, status, locale, project_id, last_message_at, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ conversation: data }, { status: 201 });
}
