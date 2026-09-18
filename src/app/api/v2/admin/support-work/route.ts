import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const account = "account:profiles!account_id(id,full_name,email,phone,account_public_id)";
export async function GET(request: Request) {
  try {
    const auth = await getPlatformAdmin("support_admin");
    if (!auth) return NextResponse.json({ error: "Support administration access required" }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind") === "tickets" ? "tickets" : "callbacks";
    const page = Math.max(1, Math.min(10000, Math.floor(Number(params.get("page")) || 1)));
    const fields = kind === "callbacks"
      ? `id,public_id,reason,preferred_date,time_window,timezone,communication_method,status,contact_name,contact_phone,contact_email,created_at,${account}`
      : `id,public_id,subject,status,priority,category,created_at,${account}`;
    const { data, error, count } = await auth.supabase.from(kind === "callbacks" ? "support_callback_requests" : "support_tickets")
      .select(fields, { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) return NextResponse.json({ error: "Could not load support requests" }, { status: 500 });
    return NextResponse.json({ rows: data, total: count, page });
  } catch {
    return NextResponse.json({ error: "Could not load support requests" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getPlatformAdmin("support_admin");
    if (!auth) return NextResponse.json({ error: "Support administration access required" }, { status: 403 });
    const parsed = z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("callbacks"), id: z.string().uuid(), status: z.enum(["requested", "confirmed", "completed", "cancelled"]) }),
      z.object({ kind: z.literal("tickets"), id: z.string().uuid(), status: z.enum(["open", "pending", "resolved", "closed"]) }),
    ]).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request status" }, { status: 400 });
    const { kind, id, status } = parsed.data;
    const changes: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (kind === "tickets") changes.resolved_at = ["resolved", "closed"].includes(status) ? new Date().toISOString() : null;
    const { data, error } = await auth.supabase.from(kind === "callbacks" ? "support_callback_requests" : "support_tickets")
      .update(changes).eq("id", id).select("id,status").maybeSingle();
    if (error) return NextResponse.json({ error: "Status update failed" }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ request: data });
  } catch {
    return NextResponse.json({ error: "Status update failed" }, { status: 500 });
  }
}
