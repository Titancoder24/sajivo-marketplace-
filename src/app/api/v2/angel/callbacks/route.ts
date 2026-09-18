import { NextResponse } from "next/server";
import { z } from "zod";
import { getAngelAuth } from "@/lib/server/angel";

const callbackSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  reason: z.string().trim().min(5).max(2000),
  preferredDate: z.string().date(),
  timeWindow: z.string().trim().min(3).max(100),
  timezone: z.string().trim().min(3).max(100),
  communicationMethod: z.enum(["phone", "whatsapp", "email", "video"]),
  contactName: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  contactEmail: z.string().trim().max(254).optional(),
}).strict();

const phoneSchema = z.string().trim().max(30).refine((value) => {
  const digits = value.replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}, "Enter a valid phone number with 7 to 15 digits.");

const contactSchema = z.object({
  contactName: z.string().trim().min(2, "Enter your contact name (at least 2 characters).").max(120),
  contactPhone: z.union([phoneSchema, z.literal("")]),
  contactEmail: z.union([z.string().trim().email("Enter a valid contact email.").max(254), z.literal("")]),
  communicationMethod: callbackSchema.shape.communicationMethod,
}).superRefine((contact, ctx) => {
  const needsPhone = contact.communicationMethod === "phone" || contact.communicationMethod === "whatsapp";
  if (needsPhone && !contact.contactPhone) ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "A phone number is required for Phone or WhatsApp." });
  if (!needsPhone && !contact.contactEmail) ctx.addIssue({ code: "custom", path: ["contactEmail"], message: "An email address is required for Email or Video." });
});

export async function POST(request: Request) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = callbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete every callback field.", issues: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.preferredDate < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "Choose today or a future date." }, { status: 400 });

  let profile: { full_name: string | null; phone: string | null; email: string | null } | null = null;
  const { contactName, contactPhone, contactEmail } = parsed.data;
  // Only omitted fields fall back; an explicitly cleared field must stay cleared.
  if (contactName === undefined || contactPhone === undefined || contactEmail === undefined) {
    const result = await auth.supabase.from("profiles").select("full_name, phone, email").eq("id", auth.userId).maybeSingle();
    if (result.error) return NextResponse.json({ error: "Could not load your contact details. Please retry." }, { status: 503 });
    profile = result.data;
  }
  const contact = contactSchema.safeParse({
    contactName: contactName ?? profile?.full_name ?? "",
    contactPhone: contactPhone ?? profile?.phone?.trim() ?? "",
    contactEmail: contactEmail ?? profile?.email?.trim() ?? "",
    communicationMethod: parsed.data.communicationMethod,
  });
  if (!contact.success) return NextResponse.json({ error: contact.error.issues[0]?.message ?? "Enter valid contact details.", issues: contact.error.flatten() }, { status: 400 });

  if (parsed.data.conversationId) {
    const { data } = await auth.supabase.from("ai_support_conversations").select("id").eq("id", parsed.data.conversationId).eq("account_id", auth.userId).maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase.from("support_callback_requests").insert({
    account_id: auth.userId,
    conversation_id: parsed.data.conversationId ?? null,
    reason: parsed.data.reason,
    preferred_date: parsed.data.preferredDate,
    time_window: parsed.data.timeWindow,
    timezone: parsed.data.timezone,
    communication_method: parsed.data.communicationMethod,
    contact_name: contact.data.contactName,
    contact_phone: contact.data.contactPhone || null,
    contact_email: contact.data.contactEmail || null,
  }).select("id, public_id, preferred_date, time_window, timezone, communication_method, contact_name, contact_phone, contact_email, status, created_at").single();
  if (error || !data) return NextResponse.json({ error: "Could not save the callback and contact details. Please retry later." }, { status: 503 });
  await auth.supabase.from("ai_action_audit_logs").insert({ account_id: auth.userId, conversation_id: parsed.data.conversationId ?? null, actor_id: auth.userId, actor_type: "user", action: "support_callback_requested", risk_level: "low", outcome: "requested", metadata: { callback_public_id: data.public_id, method: data.communication_method } });
  return NextResponse.json({ callback: data }, { status: 201 });
}
