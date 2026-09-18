import { getActiveUser } from "@/lib/supabase/account-access";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const hash = (code: string) => crypto.createHash("sha256").update(`${code}:${process.env.OTP_PEPPER ?? "sajivo-preview"}`).digest("hex");

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const purpose = String(body.purpose ?? "payment");
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "OTP service is not configured" }, { status: 503 });
  const { data: auth } = await getActiveUser(supabase);
  if (!auth.user) return NextResponse.json({ error: "Sign in to request a verification code" }, { status: 401 });
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("otp_transactions").insert({ account_id: auth.user.id, purpose, destination: auth.user.email ?? "verified account", code_hash: hash(code), expires_at: expiresAt }).select("id, public_id, expires_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ challenge: data, message: "Verification code sent to your verified account", ...(process.env.NODE_ENV !== "production" ? { previewCode: code } : {}) }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "OTP service is not configured" }, { status: 503 });
  const { data: auth } = await getActiveUser(supabase);
  if (!auth.user) return NextResponse.json({ error: "Sign in to verify this transaction" }, { status: 401 });
  const { data: challenge } = await supabase.from("otp_transactions").select("id, code_hash, attempts, expires_at, status").eq("id", body.challengeId).eq("account_id", auth.user.id).single();
  if (!challenge || challenge.status !== "pending" || new Date(challenge.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "This verification challenge has expired" }, { status: 400 });
  if (challenge.attempts >= 5) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  if (hash(String(body.code)) !== challenge.code_hash) {
    await supabase.from("otp_transactions").update({ attempts: challenge.attempts + 1, status: challenge.attempts + 1 >= 5 ? "locked" : "pending" }).eq("id", challenge.id);
    return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
  }
  const { data, error } = await supabase.from("otp_transactions").update({ status: "verified", verified_at: new Date().toISOString() }).eq("id", challenge.id).select("id, public_id, verified_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, challenge: data });
}
