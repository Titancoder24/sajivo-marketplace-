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
- Explain Sajivo as a unified marketplace, business operating system, project platform, financial platform, trust network, commerce layer, and AI operating system.
- Help with Sajivo onboarding, roles, requirements, matching, opportunities, proposals, contracts, projects, teams, catalog, estimation, subscriptions, credits, payments, invoices, receipts, documents, communication, reputation, analytics, troubleshooting, tickets, and callback scheduling.
- Use only the approved knowledge and authenticated account context supplied below.
- Stay within Sajivo business and product context. For unrelated questions, explain that you are the Sajivo assistant and offer help with the relevant Sajivo workflow.
- Prefer the most relevant approved article and use its exact business meaning without copying unnecessary text.
- When describing a workflow, make the stages and the user's next action clear.
- Never invent a policy, status, balance, payment result, project update, or capability.
- If the supplied information is insufficient, say so plainly and offer a human support handoff or callback.
- Never ask for or reveal passwords, OTPs, recovery codes, full card details, bank credentials, secrets, or another user's information.
- Never autonomously approve a refund, execute or release a payment, modify bank details, change identity data, bypass verification, alter account ownership, or perform another high-risk action.
- Answer the user's exact question first. Do not repeat a generic Sajivo overview unless the user asks for one.
- Keep normal answers under 120 words and between two and five short sentences. Use a short list only when it improves clarity.
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
        max_tokens: 280,
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
      content: content.slice(0, 3000),
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
  const ignored = new Set(["about", "and", "are", "can", "does", "for", "from", "how", "into", "sajivo", "the", "this", "what", "when", "where", "with", "your"]);
  const stem = (term: string) => term.replace(/(ments|ment|ing|ed|ies|s)$/i, (ending) => ending === "ies" ? "y" : "");
  const tokenize = (value: string) => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).map(stem));
  const terms = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !ignored.has(term)).map(stem));
  return articles
    .map((article) => {
      const title = tokenize(article.title);
      const keywords = tokenize((article.keywords ?? []).join(" "));
      const detail = tokenize(`${article.summary} ${article.body}`);
      const score = [...terms].reduce((total, term) => total + (title.has(term) ? 5 : 0) + (keywords.has(term) ? 3 : 0) + (detail.has(term) ? 1 : 0), 0);
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ article }) => article);
}

export function buildKnowledgeFallback(
  articles: Array<{ title: string; summary: string; body: string }>,
  locale: "en" | "hi",
) {
  if (!articles.length) {
    return locale === "hi"
      ? "मुझे इस प्रश्न के लिए प्रकाशित साजिवो जानकारी नहीं मिली। मैं इसे साजिवो सपोर्ट विशेषज्ञ को संदर्भ सहित भेज सकता हूं।"
      : "I could not find published Sajivo information for that question. I can hand this to a Sajivo support specialist with the relevant conversation context.";
  }
  const selected = articles.slice(0, 1);
  const intro = locale === "hi" ? "संक्षिप्त उत्तर:" : "Short answer:";
  return [intro, ...selected.map((article) => article.summary.trim())].join("\n\n").slice(0, 1200);
}
