import { NextResponse } from "next/server";
import {
  ANGEL_MODEL,
  ANGEL_SYSTEM_PROMPT,
  buildKnowledgeFallback,
  getAngelAuth,
  normalizeMessage,
  rankKnowledge,
  requestAngelCompletion,
} from "@/lib/server/angel";

const HIGH_RISK = /\b(approve|issue|process|execute|release|reverse|change|update)\b.{0,40}\b(refund|payment|bank|identity|owner|ownership|otp|verification)\b/i;

type KnowledgeArticle = { slug: string; title: string; category: string; summary: string; body: string; keywords: string[] | null };

export async function POST(request: Request) {
  const auth = await getAngelAuth();
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const message = normalizeMessage(body.message);
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await auth.supabase
    .from("ai_request_events")
    .select("id", { count: "exact", head: true })
    .eq("account_id", auth.userId)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) >= 12) {
    await auth.supabase.from("ai_request_events").insert({ account_id: auth.userId, model: ANGEL_MODEL, outcome: "rate_limited" });
    return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429 });
  }

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (conversationId) {
    const { data } = await auth.supabase.from("ai_support_conversations").select("id").eq("id", conversationId).eq("account_id", auth.userId).maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  } else {
    const { data, error } = await auth.supabase
      .from("ai_support_conversations")
      .insert({ account_id: auth.userId, locale: body.locale === "hi" ? "hi" : "en", title: message.slice(0, 80) })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Could not create conversation" }, { status: 400 });
    conversationId = data.id;
  }

  const locale = body.locale === "hi" ? "hi" : "en";
  const anchorSlugs = locale === "hi"
    ? ["sajivo-platform-overview-hi-v1", "sajivo-nine-stage-lifecycle-hi-v1"]
    : ["sajivo-platform-overview-v1", "sajivo-nine-stage-lifecycle-v1"];
  const [{ data: profile }, { data: projects }, { data: wallet }, { data: subscription }, { data: payments }, { data: articles }, { data: ranked }, { data: anchors }, { data: history }] = await Promise.all([
    auth.supabase.from("profiles").select("full_name, account_public_id, primary_role, account_type, business_account_type, business_role, account_status, verification_status").eq("id", auth.userId).single(),
    auth.supabase.from("projects").select("id, title, status, city, updated_at").or(`customer_id.eq.${auth.userId},selected_professional_id.eq.${auth.userId}`).order("updated_at", { ascending: false }).limit(8),
    auth.supabase.from("credit_wallets").select("credit_type, plan_name, included_remaining, top_up_remaining, reset_at").eq("account_id", auth.userId).limit(10),
    auth.supabase.from("account_subscriptions").select("public_id, status, current_period_end, cancel_at_period_end, plan:subscription_plans(name, billing_period)").eq("account_id", auth.userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    auth.supabase.from("payment_records").select("public_id, amount, currency, status, created_at, project_id").eq("account_id", auth.userId).order("created_at", { ascending: false }).limit(5),
    auth.supabase.from("ai_knowledge_articles").select("slug, title, category, summary, body, keywords").eq("status", "published").eq("locale", locale).limit(100),
    auth.supabase.rpc("match_ai_knowledge_articles", { query_text: message, requested_locale: locale, match_count: 6 }),
    auth.supabase.from("ai_knowledge_articles").select("slug, title, category, summary, body, keywords").in("slug", anchorSlugs).eq("status", "published"),
    auth.supabase.from("ai_support_messages").select("sender, content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(12),
  ]);

  const localMatches = rankKnowledge((articles ?? []) as KnowledgeArticle[], message);
  const matched = [...localMatches, ...((ranked ?? []) as KnowledgeArticle[])];
  const selectedArticles = [...matched, ...(!matched.length ? (anchors ?? []) as KnowledgeArticle[] : [])]
    .filter((article, index, all) => all.findIndex((candidate) => candidate.slug === article.slug) === index)
    .slice(0, 3);
  const accountContext = JSON.stringify({ profile, projects: projects ?? [], creditWallets: wallet ?? [], subscription, recentPayments: payments ?? [] });
  const knowledgeContext = selectedArticles.map((article, index) => `[KB${index + 1}] ${article.title}\nSummary: ${article.summary}\n${article.body}`).join("\n\n");
  const priorMessages = [...(history ?? [])].reverse().filter((entry) => entry.sender === "user" || entry.sender === "assistant").map((entry) => ({ role: entry.sender as "user" | "assistant", content: entry.content }));
  const safetyFlags = HIGH_RISK.test(message) ? ["high_risk_action_requested"] : [];

  const { error: userMessageError } = await auth.supabase.from("ai_support_messages").insert({
    conversation_id: conversationId,
    sender: "user",
    sender_profile_id: auth.userId,
    content: message,
    safety_flags: safetyFlags,
  });
  if (userMessageError) return NextResponse.json({ error: userMessageError.message }, { status: 400 });

  try {
    let completion;
    try {
      completion = await requestAngelCompletion([
        { role: "system", content: `${ANGEL_SYSTEM_PROMPT}\n\nAPPROVED SAJIVO KNOWLEDGE:\n${knowledgeContext || "No matching approved article was found."}\n\nAUTHENTICATED ACCOUNT CONTEXT:\n${accountContext}` },
        ...priorMessages,
        { role: "user", content: message },
      ], auth.userId);
    } catch (providerError) {
      const detail = providerError instanceof Error ? providerError.message : "Angel provider error";
      if (!detail.includes("not configured")) throw providerError;
      completion = {
        content: buildKnowledgeFallback(selectedArticles, locale),
        model: "sajivo-rag-fallback-v1",
        promptTokens: null,
        completionTokens: null,
        latencyMs: 0,
      };
    }

    const citations = selectedArticles.map((article) => ({ slug: article.slug, title: article.title, category: article.category }));
    const { data: assistantMessage, error: assistantError } = await auth.supabase.from("ai_support_messages").insert({
      conversation_id: conversationId,
      sender: "assistant",
      content: completion.content,
      citations,
      model: completion.model,
      prompt_tokens: completion.promptTokens,
      completion_tokens: completion.completionTokens,
      safety_flags: safetyFlags,
    }).select("id, sender, content, citations, model, safety_flags, created_at").single();
    if (assistantError) throw assistantError;

    await Promise.all([
      auth.supabase.from("ai_support_conversations").update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversationId),
      auth.supabase.from("ai_request_events").insert({ account_id: auth.userId, conversation_id: conversationId, model: completion.model, outcome: "success", latency_ms: completion.latencyMs, prompt_tokens: completion.promptTokens, completion_tokens: completion.completionTokens }),
      auth.supabase.from("ai_action_audit_logs").insert({ account_id: auth.userId, conversation_id: conversationId, actor_id: auth.userId, actor_type: "assistant", action: "support_answer_generated", risk_level: safetyFlags.length ? "high" : "low", outcome: "completed", metadata: { model: completion.model, knowledge: citations.map((citation) => citation.slug) } }),
    ]);
    return NextResponse.json({ conversationId, message: assistantMessage });
  } catch (error) {
    await auth.supabase.from("ai_request_events").insert({ account_id: auth.userId, conversation_id: conversationId, model: ANGEL_MODEL, outcome: "provider_error" });
    const detail = error instanceof Error ? error.message : "Angel could not respond";
    return NextResponse.json({ error: detail, conversationId }, { status: detail.includes("not configured") ? 503 : 502 });
  }
}
