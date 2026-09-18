import { getActiveUser } from "@/lib/supabase/account-access";
import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type IntegrationProvider = "openrouter" | "google_analytics" | "microsoft_clarity" | "google_search_console" | "razorpay" | "resend" | "twilio";

function encryptionKey() {
  const raw = process.env.PLATFORM_SETTINGS_ENCRYPTION_KEY;
  if (!raw) throw new Error("Platform integration encryption is not configured.");
  return createHash("sha256").update(raw).digest();
}

export function encryptIntegrationValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { encryptedValue: encrypted.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), hint: value.length > 4 ? `••••${value.slice(-4)}` : "••••" };
}

function decryptIntegrationValue(encryptedValue: string, iv: string, tag: string) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64")), decipher.final()]).toString("utf8");
}

export async function getRuntimeIntegration(provider: IntegrationProvider) {
  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const runtimeToken = process.env.SAJIVO_RUNTIME_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!runtimeToken || !url || !key) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: userData } = await getActiveUser(supabase);
  if (!userData.user) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return null;
  const runtime = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}`, "x-sajivo-runtime-token": runtimeToken } },
  });
  const { data } = await runtime.from("platform_integrations").select("encrypted_value, encryption_iv, encryption_tag, status").eq("provider", provider).eq("status", "configured").maybeSingle();
  if (!data?.encrypted_value || !data.encryption_iv || !data.encryption_tag) return null;
  return decryptIntegrationValue(data.encrypted_value, data.encryption_iv, data.encryption_tag);
}
