"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot, CalendarClock, ChevronRight, CircleAlert, Headphones,
  LifeBuoy, Loader2, MessageSquarePlus, PhoneCall, Send, ShieldCheck, Sparkles, UserRound,
} from "lucide-react";

type Conversation = { id: string; public_id: string; title: string; status: string; locale: "en" | "hi"; last_message_at: string };
type Citation = { slug: string; title: string; category: string };
type Message = { id: string; sender: "user" | "assistant" | "admin" | "system"; content: string; citations?: Citation[]; model?: string | null; safety_flags?: string[]; created_at: string };

const quickPrompts = [
  "What is Sajivo and how does the complete workflow work?",
  "How are requirements matched with professionals?",
  "Explain projects, milestones, invoices and payments",
  "How do Sajivo plans, credits and business accounts work?",
];

function statusLabel(status: string) {
  return ({ open: "Angel active", waiting_for_human: "Human handoff", resolved: "Resolved", closed: "Closed" } as Record<string, string>)[status] ?? status;
}

export function AngelSupport() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [locale, setLocale] = useState<"en" | "hi">("en");
  const chatRef = useRef<HTMLElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const conversationRequestRef = useRef(0);

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => {
    const viewport = messagesRef.current;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function loadConversations() {
    setLoading(true);
    const response = await fetch("/api/v2/angel/conversations", { cache: "no-store" });
    if (response.status === 401) { setAuthRequired(true); setLoading(false); return; }
    const payload = await response.json();
    const rows = payload.conversations ?? [];
    setConversations(rows);
    if (rows[0]) await openConversation(rows[0]);
    setLoading(false);
  }

  async function openConversation(conversation: Conversation, focusChat = false) {
    const requestId = ++conversationRequestRef.current;
    setActive(conversation);
    setLocale(conversation.locale);
    const response = await fetch(`/api/v2/angel/conversations/${conversation.id}`, { cache: "no-store" });
    const payload = await response.json();
    if (requestId !== conversationRequestRef.current) return;
    if (!response.ok) { toast.error(payload.error || "Could not load the conversation"); return; }
    setMessages(payload.messages ?? []);
    if (focusChat && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function startNew() {
    conversationRequestRef.current += 1;
    setActive(null);
    setMessages([]);
    setDraft("");
  }

  async function sendMessage(text = draft) {
    const clean = text.trim();
    if (!clean || sending) return;
    setDraft("");
    const optimistic: Message = { id: `pending-${Date.now()}`, sender: "user", content: clean, created_at: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    setSending(true);
    const response = await fetch("/api/v2/angel/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: active?.id, message: clean, locale }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error || "Angel could not respond");
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setDraft(clean);
      setSending(false);
      return;
    }
    setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), optimistic, payload.message]);
    if (!active) {
      const created: Conversation = { id: payload.conversationId, public_id: "New", title: clean.slice(0, 80), status: "open", locale, last_message_at: new Date().toISOString() };
      setActive(created);
      setConversations((current) => [created, ...current]);
    }
    setSending(false);
  }

  async function requestHuman() {
    if (!active) { toast.error("Start a conversation first so we can include its context."); return; }
    const response = await fetch("/api/v2/angel/escalate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: active.id, subject: active.title }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(payload.error || "Could not create the support ticket"); return; }
    setActive((current) => current ? { ...current, status: "waiting_for_human" } : current);
    toast.success(`Support ticket ${payload.ticket.public_id} created`);
  }

  if (authRequired) return <AuthRequired />;

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f3f5f3]">
      <header className="border-b border-[#dfe4e0] bg-white px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 sm:items-end">
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#d65f45]">SAIOS support</p><h1 className="mt-1 text-xl font-extrabold text-[#1c2723] sm:text-2xl">Angel AI</h1><p className="mt-1 hidden max-w-2xl text-xs leading-5 text-[#68716d] sm:block">Short, specific answers grounded in Sajivo's approved knowledge and your account.</p></div>
          <div className="inline-flex rounded-md border border-[#d8ded9] bg-[#f7f8f7] p-1"><button onClick={() => setLocale("en")} className={`h-8 px-3 text-xs font-bold ${locale === "en" ? "rounded bg-[#1d2a27] text-white" : "text-[#64706a]"}`}>English</button><button onClick={() => setLocale("hi")} className={`h-8 px-3 text-xs font-bold ${locale === "hi" ? "rounded bg-[#1d2a27] text-white" : "text-[#64706a]"}`}>हिन्दी</button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] gap-px bg-[#dfe4e0] lg:h-[min(680px,calc(100vh-150px))] lg:min-h-[520px] lg:grid-cols-[230px_minmax(0,1fr)_260px]">
        <aside className="order-2 max-h-72 overflow-y-auto bg-white p-4 lg:order-1 lg:max-h-none">
          <button onClick={startNew} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d65f45] px-4 text-sm font-bold text-white shadow-[0_3px_0_#a44331] active:translate-y-[2px] active:shadow-[0_1px_0_#a44331]"><MessageSquarePlus size={17} />New conversation</button>
          <p className="mb-2 mt-6 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#858e89]">Recent</p>
          <div className="space-y-1">{loading ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin text-[#7d8782]" size={18} /></div> : conversations.length ? conversations.map((conversation) => <button key={conversation.id} aria-pressed={active?.id === conversation.id} onClick={() => void openConversation(conversation, true)} className={`w-full rounded-md px-3 py-3 text-left ${active?.id === conversation.id ? "bg-[#edf2ee]" : "hover:bg-[#f6f7f6]"}`}><p className="truncate text-xs font-bold text-[#27312d]">{conversation.title}</p><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#7c8581]"><span>{statusLabel(conversation.status)}</span><span>{new Date(conversation.last_message_at).toLocaleDateString()}</span></div></button>) : <p className="px-3 py-8 text-center text-xs leading-5 text-[#7b8580]">Your Angel conversations will appear here.</p>}</div>
        </aside>

        <section ref={chatRef} aria-label="Angel conversation" className="order-1 flex h-[calc(100dvh-227px)] min-h-[380px] max-h-[680px] min-w-0 scroll-mt-16 flex-col bg-[#f8f9f8] lg:order-2 lg:h-auto lg:min-h-0 lg:max-h-none">
          <div className="flex h-16 items-center gap-3 border-b border-[#e1e5e2] bg-white px-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d2a27] text-white shadow-[0_3px_0_#0c1311]"><Bot size={20} /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold">Angel</p><p className="flex items-center gap-1.5 text-[10px] text-[#66716c]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />AI support · Human handoff available</p></div>{active ? <span className="ml-auto rounded-full bg-[#edf3ef] px-2.5 py-1 text-[10px] font-bold text-[#486055]">{statusLabel(active.status)}</span> : null}</div>
          <div ref={messagesRef} aria-live="polite" aria-label="Conversation messages" className="min-h-[200px] flex-1 space-y-4 overflow-y-auto p-4 sm:min-h-[320px] sm:p-6">
            {!messages.length ? <Welcome onPrompt={(prompt) => void sendMessage(prompt)} /> : messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {sending ? <div className="flex items-center gap-2 text-xs font-semibold text-[#6e7773]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d2a27] text-white"><Bot size={15} /></span><Loader2 size={14} className="animate-spin" />Angel is checking approved Sajivo information…</div> : null}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-[#dde2de] bg-white p-4"><div className="flex items-end gap-2 rounded-md border border-[#cfd6d1] bg-[#fbfcfb] p-2 shadow-sm focus-within:border-[#89968f]"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={2} maxLength={4000} placeholder={locale === "hi" ? "अपना सवाल लिखें…" : "Ask about your account, project, plan, credits, or payments…"} className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none" /><button disabled={sending || !draft.trim()} aria-label="Send to Angel" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#d65f45] text-white shadow-[0_3px_0_#a44331] disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button></div><p className="mt-2 text-center text-[10px] text-[#87908b]">Angel can explain and route support, but cannot authorize high-risk financial or identity actions.</p></form>
        </section>

        <aside className="order-3 overflow-y-auto bg-white p-5 lg:max-h-none">
          <h2 className="text-sm font-extrabold">Support options</h2>
          <button onClick={() => void requestHuman()} className="mt-4 flex w-full items-center gap-3 rounded-md border border-[#dce1dd] bg-white p-4 text-left shadow-[0_3px_0_#dce1dd] active:translate-y-[2px] active:shadow-none"><span className="grid h-9 w-9 place-items-center rounded bg-[#edf2ef] text-[#334a40]"><Headphones size={18} /></span><span className="min-w-0 flex-1"><b className="block text-xs">Request a specialist</b><span className="mt-1 block text-[10px] leading-4 text-[#717b76]">Create a ticket with this context</span></span><ChevronRight size={15} /></button>
          <button onClick={() => setCallbackOpen((value) => !value)} className="mt-3 flex w-full items-center gap-3 rounded-md border border-[#dce1dd] bg-white p-4 text-left shadow-[0_3px_0_#dce1dd] active:translate-y-[2px] active:shadow-none"><span className="grid h-9 w-9 place-items-center rounded bg-[#fff0eb] text-[#c8543d]"><CalendarClock size={18} /></span><span className="min-w-0 flex-1"><b className="block text-xs">Schedule a callback</b><span className="mt-1 block text-[10px] leading-4 text-[#717b76]">Choose date, window, and channel</span></span><ChevronRight size={15} /></button>
          {callbackOpen ? <CallbackForm conversationId={active?.id ?? null} onDone={() => setCallbackOpen(false)} /> : null}
          <div className="mt-6 border-t border-[#e4e7e5] pt-5"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /><h3 className="text-xs font-extrabold">Your security</h3></div><p className="mt-2 text-[11px] leading-5 text-[#707975]">Angel and Sajivo support will never ask for your password, OTP, recovery code, or full payment credentials.</p></div>
          <div className="mt-5 border-t border-[#e4e7e5] pt-5"><div className="flex items-center gap-2"><LifeBuoy size={17} className="text-[#d65f45]" /><h3 className="text-xs font-extrabold">What Angel knows</h3></div><p className="mt-2 text-[11px] leading-5 text-[#707975]">The Sajivo business model, user roles, complete nine-stage lifecycle, matching, projects, catalog, estimation, finance, plans, credits, SAIOS, trust, integrations, analytics, and support workflows.</p></div>
        </aside>
      </div>
    </div>
  );
}

function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return <div className="mx-auto max-w-2xl py-10 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#1d2a27] text-white shadow-[0_5px_0_#0d1512]"><Sparkles size={27} /></span><h2 className="mt-6 text-xl font-extrabold">Hi, I’m Angel.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#69736e]">Ask me about Sajivo, its complete business and project workflow, or your authorized account context. I can also create a support ticket or arrange a real support call.</p><div className="mt-7 grid gap-2 sm:grid-cols-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => onPrompt(prompt)} className="rounded-md border border-[#dce2dd] bg-white px-4 py-3 text-left text-xs font-semibold leading-5 text-[#46514c] shadow-[0_2px_0_#dce2dd] hover:border-[#b9c4bd]">{prompt}</button>)}</div></div>;
}

function MessageBubble({ message }: { message: Message }) {
  const user = message.sender === "user";
    const admin = message.sender === "admin";
  return <div className={`flex gap-3 ${user ? "justify-end" : "justify-start"}`}>{!user ? <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${admin ? "bg-[#d65f45]" : "bg-[#1d2a27]"} text-white`}>{admin ? <Headphones size={15} /> : <Bot size={15} />}</span> : null}<div className={`max-w-[76%] rounded-md px-4 py-3 text-sm leading-6 shadow-sm [overflow-wrap:anywhere] ${user ? "bg-[#d65f45] text-white" : "border border-[#e0e4e1] bg-white text-[#29332f]"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.citations?.length ? <details className="mt-3 border-t border-[#e5e9e6] pt-2"><summary className="cursor-pointer text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#86908b]">{message.citations.length} approved source{message.citations.length === 1 ? "" : "s"}</summary><div className="mt-2 flex flex-wrap gap-1">{message.citations.map((citation) => <span key={citation.slug} className="rounded bg-[#edf2ef] px-2 py-1 text-[9px] font-semibold text-[#53635b]">{citation.title}</span>)}</div></details> : null}</div>{user ? <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8ece9] text-[#53605a]"><UserRound size={15} /></span> : null}</div>;
}

function CallbackForm({ conversationId, onDone }: { conversationId: string | null; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [loadingContact, setLoadingContact] = useState(true);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [method, setMethod] = useState("phone");
  const [error, setError] = useState("");
  const needsPhone = method === "phone" || method === "whatsapp";

  useEffect(() => {
    const controller = new AbortController();
    async function loadContact() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (response.ok && !controller.signal.aborted) {
          const profile = payload.profile;
          setContact({
            name: typeof profile?.full_name === "string" ? profile.full_name : "",
            phone: typeof profile?.phone === "string" ? profile.phone : "",
            email: typeof profile?.email === "string" ? profile.email : "",
          });
        }
      } catch {
        // Contact entry remains available if profile prefill cannot be loaded.
      } finally {
        if (!controller.signal.aborted) setLoadingContact(false);
      }
    }
    void loadContact();
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loadingContact) return;
    const data = new FormData(event.currentTarget);
    const contactName = contact.name.trim();
    const contactPhone = contact.phone.trim();
    const contactEmail = contact.email.trim();
    if (contactName.length < 2) { setError("Enter your contact name (at least 2 characters)."); return; }
    const digits = contactPhone.replace(/\D/g, "");
    if ((needsPhone && !contactPhone) || (contactPhone && (!/^\+?[\d\s().-]+$/.test(contactPhone) || digits.length < 7 || digits.length > 15))) {
      setError("Enter a valid phone number with 7 to 15 digits."); return;
    }
    if (!needsPhone && !contactEmail) { setError("An email address is required for Email or Video."); return; }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v2/angel/callbacks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, contactName, contactPhone, contactEmail, reason: data.get("reason"), preferredDate: data.get("date"), timeWindow: data.get("window"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, communicationMethod: method }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.callback?.public_id) {
        setError(payload.error || "Could not request callback. Please retry."); return;
      }
      toast.success(`Callback ${payload.callback.public_id} requested`);
      onDone();
    } catch {
      setError("Could not reach support. Your details are still here; please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "mt-1 h-9 w-full min-w-0 rounded border border-[#dccfc9] bg-white px-2 text-xs";
  return <form onSubmit={submit} className="mt-3 border-t border-[#ecd9d3] pt-3">
    <fieldset disabled={submitting || loadingContact} className="min-w-0 space-y-3">
      <label className="block text-[10px] font-bold">Contact name<input name="contactName" autoComplete="name" required minLength={2} maxLength={120} value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} className={inputClass} /></label>
      <label className="block text-[10px] font-bold">Contact method<select name="method" value={method} onChange={(event) => { setMethod(event.target.value); setError(""); }} className={inputClass}><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="video">Video</option></select></label>
      <label className="block text-[10px] font-bold">Phone number{needsPhone ? " (required)" : " (optional)"}<input name="contactPhone" type="tel" autoComplete="tel" required={needsPhone} maxLength={30} value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} className={inputClass} /></label>
      <label className="block text-[10px] font-bold">{method === "video" ? "Video invitation email" : "Email address"}{needsPhone ? " (optional)" : " (required)"}<input name="contactEmail" type="email" autoComplete="email" required={!needsPhone} maxLength={254} value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} className={inputClass} /></label>
      <label className="block text-[10px] font-bold">Reason<textarea name="reason" required minLength={5} maxLength={2000} rows={3} className="mt-1 w-full resize-none rounded border border-[#dccfc9] bg-white p-2 text-xs outline-none" /></label>
      <label className="block text-[10px] font-bold">Preferred date<input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} className={inputClass} /></label>
      <label className="block text-[10px] font-bold">Time window<select name="window" className={inputClass}><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option></select></label>
      <button disabled={submitting || loadingContact} className="flex h-9 w-full items-center justify-center gap-2 rounded bg-[#d65f45] text-xs font-bold text-white shadow-[0_2px_0_#a44331] disabled:opacity-50">{submitting || loadingContact ? <Loader2 className="animate-spin" size={14} /> : <PhoneCall size={14} />}{loadingContact ? "Loading contact..." : "Request callback"}</button>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
  </form>;
}

function AuthRequired() {
  return <div className="grid min-h-[calc(100vh-70px)] place-items-center bg-[#f3f5f3] p-6"><div className="max-w-md rounded-md border border-[#dce2dd] bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto text-[#d65f45]" size={32} /><h1 className="mt-4 text-xl font-extrabold">Sign in to speak with Angel</h1><p className="mt-3 text-sm leading-6 text-[#6d7671]">Authentication keeps account, project, subscription, credit, and payment context private.</p><Link href="/login?next=/v2/support" className="mt-6 inline-flex h-11 items-center rounded-md bg-[#d65f45] px-5 text-sm font-bold text-white shadow-[0_3px_0_#a44331]">Sign in securely</Link></div></div>;
}
