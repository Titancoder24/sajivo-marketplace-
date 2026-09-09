import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inspirationSchema = z.object({
  title: z.string().trim().min(2).max(140),
  imageUrl: z.string().url().max(2000),
  city: z.string().trim().max(100).optional(),
  projectType: z.string().trim().max(100).optional(),
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await supabase.from("saved_inspirations").select("id, title, image_url, city, project_type, created_at").eq("account_id", auth.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ inspirations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const parsed = inspirationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid inspiration" }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in to save inspiration." }, { status: 401 });
  const { data, error } = await supabase.from("saved_inspirations").upsert({ account_id: auth.user.id, title: parsed.data.title, image_url: parsed.data.imageUrl, city: parsed.data.city, project_type: parsed.data.projectType }, { onConflict: "account_id,title" }).select("id, title").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ inspiration: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Inspiration ID is required" }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { error } = await supabase.from("saved_inspirations").delete().eq("id", id).eq("account_id", auth.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
