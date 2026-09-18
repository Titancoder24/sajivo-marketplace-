import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const fields = "id,full_name,email,phone,city,primary_role,account_status,account_public_id,created_at,updated_at";
const edit = z.object({
  id: z.string().uuid(), full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30), city: z.string().trim().max(100),
  account_status: z.enum(["active", "suspended"]),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
}).strict();

export async function GET(request: Request) {
  try {
    const auth = await getPlatformAdmin("super_admin");
    if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10000, Math.floor(Number(params.get("page")) || 1)));
    const search = (params.get("search") || "").replace(/[^\p{L}\p{N}@ .+_-]/gu, "").slice(0, 100);
    let query = auth.supabase.from("profiles").select(fields, { count: "exact" }).order("created_at", { ascending: false });
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,account_public_id.ilike.%${search}%`);
    const { data, error, count } = await query.range((page - 1) * 25, page * 25 - 1);
    if (error) return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
    const { data: admins, error: adminError } = await auth.supabase.from("platform_admins").select("profile_id");
    if (adminError) return NextResponse.json({ error: "Could not verify protected accounts" }, { status: 500 });
    const protectedIds = new Set((admins || []).map((item) => item.profile_id));
    return NextResponse.json({ accounts: (data || []).map((item) => ({ ...item, protected: protectedIds.has(item.id) })), total: count, page });
  } catch {
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getPlatformAdmin("super_admin");
    if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
    const parsed = edit.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter valid account details and an ISO timestamp version" }, { status: 400 });
    const { id, expectedUpdatedAt, ...values } = parsed.data;
    const protectedAccount = await auth.supabase.from("platform_admins").select("profile_id").eq("profile_id", id).maybeSingle();
    if (protectedAccount.error) return NextResponse.json({ error: "Could not verify account permissions" }, { status: 500 });
    if (id === auth.userId || protectedAccount.data) return NextResponse.json({ error: "Administrator accounts cannot be edited here" }, { status: 403 });
    // Compare and write in one statement so a stale form cannot undo a suspension.
    const { data, error } = await auth.supabase.from("profiles")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id).eq("updated_at", expectedUpdatedAt).select(fields).maybeSingle();
    if (error) return NextResponse.json({ error: "Account update failed" }, { status: 500 });
    if (!data) {
      const current = await auth.supabase.from("profiles").select("id").eq("id", id).maybeSingle();
      if (current.error) return NextResponse.json({ error: "Could not verify account version" }, { status: 500 });
      if (!current.data) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      return NextResponse.json({ error: "This account changed since you opened it. Reload the account before saving." }, { status: 409 });
    }
    return NextResponse.json({ account: data });
  } catch {
    return NextResponse.json({ error: "Account update failed" }, { status: 500 });
  }
}
