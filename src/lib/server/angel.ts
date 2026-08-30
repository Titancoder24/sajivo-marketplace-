import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getRuntimeIntegration } from "@/lib/server/integrations";

export const ANGEL_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-3.5-flash";

export type AngelAuth = {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  userId: string;
};

export async function getAngelAuth(): Promise<AngelAuth | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}

export async function getPlatformAdmin(requiredRole?: "super_admin" | "support_admin" | "knowledge_manager" | "analyst") {
  const auth = await getAngelAuth();
  if (!auth) return null;
  const { data } = await auth.supabase
    .from("platform_admins")
    .select("profile_id, role, status, permissions")
    .eq("profile_id", auth.userId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  if (requiredRole && data.role !== "super_admin" && data.role !== requiredRole) return null;
  return { ...auth, admin: data };
}

export function normalizeMessage(value: unknown) {
  return String(value ?? "").replace(/\0/g, "").trim().slice(0, 4000);
}

export function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 20).map(([key, entry]) => [key.slice(0, 80), typeof entry === "string" ? entry.slice(0, 500) : entry]));
}

export function anonymousUserTag(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 24);
}

export const ANGEL_SYSTEM_PROMPT = `You are Angel, Sajivo's AI customer support assistant.

Your responsibilities:
- Help with Sajivo accounts, projects, subscriptions, credits, payments, invoices, receipts, communication, troubleshooting, tickets, and callback scheduling.
- Use only the approved knowledge and authenticated account context supplied below.
- Never invent a policy, status, balance, payment result, project update, or capability.
- If the supplied information is insufficient, say so plainly and offer a human support handoff or callback.
- Never ask for or reveal passwords, OTPs, recovery codes, full card details, bank credentials, secrets, or another user's information.
- Never autonomously approve a refund, execute or release a payment, modify bank details, change identity data, bypass verification, alter account ownership, or perform another high-risk action.
- Keep answers concise, calm, practical, and specific. Mention the relevant Sajivo section when useful.
- Respond in the requested conversation language. Hindi responses must use natural Devanagari Hindi.
- Do not claim that an action was completed unless the application context explicitly confirms it.

When human review is needed, use this exact sentence: "I can hand this to a Sajivo support specialist with the relevant conversation context."`;

type OpenRouterMessage = { role: "system" | "user" | "assistant"; content: string };

export async function requestAngelCompletion(messages: OpenRouterMessage[], userId: string) {
  const apiKey = await getRuntimeIntegration("openrouter");
  if (!apiKey) throw new Error("Angel AI is not configured yet.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const started = Date.now();
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
        "X-Title": "Sajivo Angel AI",
      },
      body: JSON.stringify({
        model: ANGEL_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 700,
        user: anonymousUserTag(userId),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    } | null;
    if (!response.ok) throw new Error(payload?.error?.message || `OpenRouter returned ${response.status}`);
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenRouter returned an empty response.");
    return {
      content: content.slice(0, 12000),
      model: payload?.model || ANGEL_MODEL,
      promptTokens: payload?.usage?.prompt_tokens ?? null,
      completionTokens: payload?.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function rankKnowledge<T extends { title: string; summary: string; body: string; keywords: string[] | null }>(articles: T[], message: string) {
  const terms = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2));
  return articles
    .map((article) => {
      const haystack = `${article.title} ${article.summary} ${article.body} ${(article.keywords ?? []).join(" ")}`.toLowerCase();
      const score = [...terms].reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { article, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ article }) => article);
}
