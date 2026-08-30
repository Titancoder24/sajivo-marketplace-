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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

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

  async function openConversation(conversation: Conversation) {
    setActive(conversation);
    setLocale(conversation.locale);
    const response = await fetch(`/api/v2/angel/conversations/${conversation.id}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error || "Could not load the conversation"); return; }
    setMessages(payload.messages ?? []);
  }

  function startNew() {
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
      <header className="border-b border-[#dfe4e0] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#d65f45]">SAIOS business and customer support</p><h1 className="mt-2 text-2xl font-extrabold text-[#1c2723] sm:text-3xl">Angel AI</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68716d]">Sajivo-focused guidance grounded in the approved business, platform, workflow, and authenticated account knowledge base.</p></div>
          <div className="inline-flex rounded-md border border-[#d8ded9] bg-[#f7f8f7] p-1"><button onClick={() => setLocale("en")} className={`h-8 px-3 text-xs font-bold ${locale === "en" ? "rounded bg-[#1d2a27] text-white" : "text-[#64706a]"}`}>English</button><button onClick={() => setLocale("hi")} className={`h-8 px-3 text-xs font-bold ${locale === "hi" ? "rounded bg-[#1d2a27] text-white" : "text-[#64706a]"}`}>हिन्दी</button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-px bg-[#dfe4e0] lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="min-h-[720px] bg-white p-4">
          <button onClick={startNew} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d65f45] px-4 text-sm font-bold text-white shadow-[0_3px_0_#a44331] active:translate-y-[2px] active:shadow-[0_1px_0_#a44331]"><MessageSquarePlus size={17} />New conversation</button>
          <p className="mb-2 mt-6 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#858e89]">Recent</p>
          <div className="space-y-1">{loading ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin text-[#7d8782]" size={18} /></div> : conversations.length ? conversations.map((conversation) => <button key={conversation.id} onClick={() => void openConversation(conversation)} className={`w-full rounded-md px-3 py-3 text-left ${active?.id === conversation.id ? "bg-[#edf2ee]" : "hover:bg-[#f6f7f6]"}`}><p className="truncate text-xs font-bold text-[#27312d]">{conversation.title}</p><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#7c8581]"><span>{statusLabel(conversation.status)}</span><span>{new Date(conversation.last_message_at).toLocaleDateString()}</span></div></button>) : <p className="px-3 py-8 text-center text-xs leading-5 text-[#7b8580]">Your Angel conversations will appear here.</p>}</div>
        </aside>

        <section className="flex min-h-[720px] min-w-0 flex-col bg-[#f8f9f8]">
          <div className="flex h-16 items-center gap-3 border-b border-[#e1e5e2] bg-white px-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d2a27] text-white shadow-[0_3px_0_#0c1311]"><Bot size={20} /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold">Angel</p><p className="flex items-center gap-1.5 text-[10px] text-[#66716c]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />AI support · Human handoff available</p></div>{active ? <span className="ml-auto rounded-full bg-[#edf3ef] px-2.5 py-1 text-[10px] font-bold text-[#486055]">{statusLabel(active.status)}</span> : null}</div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {!messages.length ? <Welcome onPrompt={(prompt) => void sendMessage(prompt)} /> : messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {sending ? <div className="flex items-center gap-2 text-xs font-semibold text-[#6e7773]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d2a27] text-white"><Bot size={15} /></span><Loader2 size={14} className="animate-spin" />Angel is checking approved Sajivo information…</div> : null}
            <div ref={endRef} />
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-[#dde2de] bg-white p-4"><div className="flex items-end gap-2 rounded-md border border-[#cfd6d1] bg-[#fbfcfb] p-2 shadow-sm focus-within:border-[#89968f]"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={2} maxLength={4000} placeholder={locale === "hi" ? "अपना सवाल लिखें…" : "Ask about your account, project, plan, credits, or payments…"} className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none" /><button disabled={sending || !draft.trim()} aria-label="Send to Angel" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#d65f45] text-white shadow-[0_3px_0_#a44331] disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button></div><p className="mt-2 text-center text-[10px] text-[#87908b]">Angel can explain and route support, but cannot authorize high-risk financial or identity actions.</p></form>
        </section>

        <aside className="min-h-[720px] bg-white p-5">
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
  return <div className={`flex gap-3 ${user ? "justify-end" : "justify-start"}`}>{!user ? <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${admin ? "bg-[#d65f45]" : "bg-[#1d2a27]"} text-white`}>{admin ? <Headphones size={15} /> : <Bot size={15} />}</span> : null}<div className={`max-w-[82%] rounded-md px-4 py-3 text-sm leading-6 shadow-sm ${user ? "bg-[#d65f45] text-white" : "border border-[#e0e4e1] bg-white text-[#29332f]"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.citations?.length ? <div className="mt-3 border-t border-[#e5e9e6] pt-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#86908b]">Approved sources</p><div className="mt-1 flex flex-wrap gap-1">{message.citations.map((citation) => <span key={citation.slug} className="rounded bg-[#edf2ef] px-2 py-1 text-[9px] font-semibold text-[#53635b]">{citation.title}</span>)}</div></div> : null}</div>{user ? <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8ece9] text-[#53605a]"><UserRound size={15} /></span> : null}</div>;
}

function CallbackForm({ conversationId, onDone }: { conversationId: string | null; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v2/angel/callbacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, reason: data.get("reason"), preferredDate: data.get("date"), timeWindow: data.get("window"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, communicationMethod: data.get("method") }) });
    const payload = await response.json().catch(() => ({})); setSubmitting(false);
    if (!response.ok) { toast.error(payload.error || "Could not request callback"); return; }
    toast.success(`Callback ${payload.callback.public_id} requested`); onDone();
  }
  return <form onSubmit={submit} className="mt-3 space-y-3 rounded-md border border-[#ecd9d3] bg-[#fff8f5] p-3"><label className="block text-[10px] font-bold">Reason<textarea name="reason" required minLength={5} rows={3} className="mt-1 w-full resize-none rounded border border-[#dccfc9] bg-white p-2 text-xs outline-none" /></label><label className="block text-[10px] font-bold">Preferred date<input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} className="mt-1 h-9 w-full rounded border border-[#dccfc9] bg-white px-2 text-xs" /></label><label className="block text-[10px] font-bold">Time window<select name="window" className="mt-1 h-9 w-full rounded border border-[#dccfc9] bg-white px-2 text-xs"><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option></select></label><label className="block text-[10px] font-bold">Contact method<select name="method" className="mt-1 h-9 w-full rounded border border-[#dccfc9] bg-white px-2 text-xs"><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="video">Video</option></select></label><button disabled={submitting} className="flex h-9 w-full items-center justify-center gap-2 rounded bg-[#d65f45] text-xs font-bold text-white shadow-[0_2px_0_#a44331] disabled:opacity-50">{submitting ? <Loader2 className="animate-spin" size={14} /> : <PhoneCall size={14} />}Request callback</button></form>;
}

function AuthRequired() {
  return <div className="grid min-h-[calc(100vh-70px)] place-items-center bg-[#f3f5f3] p-6"><div className="max-w-md rounded-md border border-[#dce2dd] bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto text-[#d65f45]" size={32} /><h1 className="mt-4 text-xl font-extrabold">Sign in to speak with Angel</h1><p className="mt-3 text-sm leading-6 text-[#6d7671]">Authentication keeps account, project, subscription, credit, and payment context private.</p><Link href="/login?next=/v2/support" className="mt-6 inline-flex h-11 items-center rounded-md bg-[#d65f45] px-5 text-sm font-bold text-white shadow-[0_3px_0_#a44331]">Sign in securely</Link></div></div>;
}
