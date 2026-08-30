import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const articleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(["account", "projects", "subscriptions", "credits", "payments", "communication", "security", "support"]),
  summary: z.string().trim().min(10).max(500),
  body: z.string().trim().min(20).max(12000),
  status: z.enum(["draft", "published", "archived"]),
  locale: z.enum(["en", "hi"]).default("en"),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getPlatformAdmin("knowledge_manager");
  if (!auth) return NextResponse.json({ error: "Knowledge-manager access required" }, { status: 403 });
  const { id } = await context.params;
  const parsed = articleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Article fields are invalid", issues: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await auth.supabase.from("ai_knowledge_articles").update({
    ...parsed.data,
    approved_by: parsed.data.status === "published" ? auth.userId : null,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("id, slug, title, category, locale, summary, body, keywords, status, version, updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ article: data });
}
