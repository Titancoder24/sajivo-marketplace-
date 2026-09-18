import { getActiveUser } from "@/lib/supabase/account-access";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  sessionId: z.string().uuid(),
  eventName: z.enum(["page_view", "ui_click", "signup_started", "signup_completed", "login_completed", "requirement_published", "proposal_submitted", "project_created", "subscription_viewed", "angel_opened", "angel_message_sent"]),
  path: z.string().startsWith("/").max(500),
  referrerHost: z.string().max(255).optional().nullable(),
  viewportWidth: z.number().int().min(1).max(10000).optional(),
  viewportHeight: z.number().int().min(1).max(10000).optional(),
  metadata: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
}).refine(({ metadata }) => {
  if (!metadata || (!("x_pct" in metadata) && !("y_pct" in metadata))) return true;
  return [metadata.x_pct, metadata.y_pct].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1);
}, { message: "Click coordinates must be paired numbers between zero and one" });

export async function POST(request: Request) {
  try {
    const parsed = eventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Analytics storage is unavailable" }, { status: 503 });
    const { data: auth, error: authError } = await getActiveUser(supabase);
    if (authError && authError.name !== "AuthSessionMissingError") {
      return NextResponse.json({ error: "Analytics identity could not be verified" }, { status: 503 });
    }
    const event = parsed.data;
    const { error } = await supabase.from("analytics_events").insert({ session_id: event.sessionId, account_id: auth.user?.id ?? null, event_name: event.eventName, path: event.path, referrer_host: event.referrerHost ?? null, viewport_width: event.viewportWidth ?? null, viewport_height: event.viewportHeight ?? null, metadata: event.metadata ?? {} });
    if (error) return NextResponse.json({ error: "Analytics event could not be stored" }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Analytics storage is temporarily unavailable" }, { status: 503 });
  }
}
