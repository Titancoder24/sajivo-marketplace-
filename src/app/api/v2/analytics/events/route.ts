import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  sessionId: z.string().uuid(),
  eventName: z.enum(["page_view", "ui_click", "signup_started", "signup_completed", "login_completed", "requirement_published", "proposal_submitted", "project_created", "subscription_viewed", "angel_opened", "angel_message_sent"]),
  path: z.string().startsWith("/").max(500),
  referrerHost: z.string().max(255).optional().nullable(),
  viewportWidth: z.number().int().min(240).max(10000).optional(),
  viewportHeight: z.number().int().min(240).max(10000).optional(),
  metadata: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  const event = parsed.data;
  const { error } = await supabase.from("analytics_events").insert({ session_id: event.sessionId, account_id: auth.user?.id ?? null, event_name: event.eventName, path: event.path, referrer_host: event.referrerHost ?? null, viewport_width: event.viewportWidth ?? null, viewport_height: event.viewportHeight ?? null, metadata: event.metadata ?? {} });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
