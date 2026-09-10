import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const articleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(["account", "projects", "subscriptions", "credits", "payments", "communication", "security", "support"]),
  summary: z.string().trim().min(10).max(500),
  body: z.string().trim().min(20).max(12000),
  status: z.enum(["draft", "published"]).default("draft"),
  locale: z.enum(["en", "hi"]).default("en"),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

export async function POST(request: Request) {
  const auth = await getPlatformAdmin("knowledge_manager");
  if (!auth) return NextResponse.json({ error: "Knowledge-manager access required" }, { status: 403 });
  const parsed = articleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Article fields are invalid" }, { status: 400 });
  const published = parsed.data.status === "published";
  const { data, error } = await auth.supabase.from("ai_knowledge_articles").insert({
    ...parsed.data,
    slug: `${slugify(parsed.data.title)}-${parsed.data.locale}-${Date.now().toString(36)}`,
    created_by: auth.userId,
    approved_by: published ? auth.userId : null,
    published_at: published ? new Date().toISOString() : null,
  }).select("id, slug, title, category, locale, summary, body, keywords, status, version, updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ article: data }, { status: 201 });
}
