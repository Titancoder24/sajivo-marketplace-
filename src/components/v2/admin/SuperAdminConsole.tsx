"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity, BarChart3, BookOpenCheck, Bot, CalendarClock, CheckCircle2, ChevronRight, CircleAlert,
  Globe2, KeyRound,
  Headphones, LayoutDashboard, Loader2, LockKeyhole, MessageSquareText, RefreshCw, Send,
  ShieldCheck, TicketCheck, UsersRound,
} from "lucide-react";
import { AnalyticsPanel, IntegrationsPanel, SeoPanel } from "./AdminGrowthPanels";

type Overview = {
  admin: { role: string; permissions: string[] };
  metrics: { profiles: number; conversations: number; waiting: number; openTickets: number; callbacks: number; aiRequests24h: number };
  conversations: Array<{ id: string; public_id: string; title: string; status: string; locale: string; last_message_at: string; account: { full_name: string; account_public_id: string } | null }>;
  tickets: Array<{ id: string; public_id: string; subject: string; status: string; priority: string; category: string; created_at: string; account: { full_name: string; account_public_id: string } | null }>;
  knowledge: Array<{ id: string; slug: string; title: string; category: string; locale: "en" | "hi"; summary: string; body: string; keywords: string[]; status: "draft" | "published" | "archived"; version: number; updated_at: string }>;
};

type ThreadDetail = { conversation: Overview["conversations"][number] & { summary?: string | null }; messages: Array<{ id: string; sender: string; content: string; safety_flags: string[]; created_at: string }> };
type Section = "overview" | "analytics" | "conversations" | "tickets" | "knowledge" | "seo" | "integrations";

const sectionNav = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", Icon: BarChart3 },
  { key: "conversations", label: "Conversations", Icon: MessageSquareText },
  { key: "tickets", label: "Support tickets", Icon: TicketCheck },
  { key: "knowledge", label: "Knowledge base", Icon: BookOpenCheck },
  { key: "seo", label: "SEO & GEO", Icon: Globe2 },
  { key: "integrations", label: "Integrations", Icon: KeyRound },
] as const;

const adminChromeStyle = `body:has([data-super-admin-console]) > div > header.sticky, body:has([data-super-admin-console]) nav[aria-label="V2 mobile navigation"], body:has([data-super-admin-console]) > aside[aria-label="Appearance and language preferences"], body:has([data-super-admin-console]) > button[aria-label="Mute interface sounds"], body:has([data-super-admin-console]) > button[aria-label="Enable interface sounds"] { display: none; } body:has([data-super-admin-console]) > div > main { min-height: 100vh; padding-bottom: 0; }`;

export function SuperAdminConsole() {
  const [data, setData] = useState<Overview | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Overview["knowledge"][number] | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/v2/admin/overview", { cache: "no-store" });
    if (response.status === 403) { setForbidden(true); setLoading(false); return; }
    const payload = await response.json();
    if (!response.ok) toast.error(payload.error || "Could not load administration data");
    else setData(payload);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function openThread(id: string) {
    const response = await fetch(`/api/v2/admin/conversations/${id}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error || "Could not load conversation"); return; }
    setSelectedThread(payload);
    setSection("conversations");
  }

  if (loading) return <div data-super-admin-console className="grid min-h-screen place-items-center bg-[#f2f4f2]"><style>{adminChromeStyle}</style><Loader2 className="animate-spin text-[#3f5149]" size={28} /></div>;
  if (forbidden) return <div data-super-admin-console><style>{adminChromeStyle}</style><Forbidden /></div>;
  if (!data) return <div data-super-admin-console className="grid min-h-screen place-items-center"><style>{adminChromeStyle}</style>Administration data is unavailable.</div>;

  return (
    <div data-super-admin-console className="min-h-screen bg-[#eef1ef] text-[#19221e]">
      <style>{adminChromeStyle}</style>
      <div className="grid min-h-screen lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="border-r border-[#dbe0dc] bg-[#17211d] p-4 text-white">
          <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-5"><span className="grid h-10 w-10 place-items-center rounded-md bg-[#d65f45] shadow-[0_3px_0_#8d3928]"><ShieldCheck size={20} /></span><div><p className="text-sm font-extrabold">Control room</p><p className="mt-0.5 text-[10px] text-white/55">{data.admin.role.replaceAll("_", " ")}</p></div></div>
          <nav className="mt-5 space-y-1">{sectionNav.map(({ key, label, Icon }) => <button key={key} onClick={() => setSection(key)} className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-bold ${section === key ? "bg-white text-[#17211d]" : "text-white/68 hover:bg-white/8 hover:text-white"}`}><Icon size={17} />{label}</button>)}</nav>
          <div className="mt-6 border-t border-white/10 pt-5"><Link href="/v2/support" className="flex items-center gap-3 rounded-md px-3 py-3 text-xs font-bold text-white/70 hover:bg-white/8"><Bot size={17} />Open Angel</Link><a href="https://docs.google.com/document/d/1gC_KlSdzNiWc9KZhokNobLXQ5LEt1Mqu/edit" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md px-3 py-3 text-xs font-bold text-white/70 hover:bg-white/8"><BookOpenCheck size={17} />Implementation brief</a></div>
          <div className="mt-8 rounded-md border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-[10px] font-bold text-emerald-300"><LockKeyhole size={14} />Server-authorized</div><p className="mt-2 text-[10px] leading-4 text-white/45">Access is checked against the Supabase platform admin registry on every request.</p></div>
        </aside>

        <main className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1dd] bg-white px-5 py-5 sm:px-7"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#d65f45]">Sajivo operations</p><h1 className="mt-1 text-2xl font-extrabold">{sectionNav.find((item) => item.key === section)?.label}</h1></div><button onClick={() => void load()} className="flex h-10 items-center gap-2 rounded-md border border-[#d8ded9] bg-white px-3 text-xs font-bold shadow-[0_2px_0_#d8ded9]"><RefreshCw size={15} />Refresh</button></header>
          <div className="p-4 sm:p-6 lg:p-7">
            {section === "overview" ? <OverviewPanel data={data} onThread={openThread} /> : null}
            {section === "analytics" ? <AnalyticsPanel /> : null}
            {section === "conversations" ? <ConversationsPanel data={data} selected={selectedThread} onThread={openThread} onRefresh={load} /> : null}
            {section === "tickets" ? <TicketsPanel data={data} /> : null}
            {section === "knowledge" ? <KnowledgePanel data={data} selected={selectedArticle} onSelect={setSelectedArticle} onRefresh={load} /> : null}
            {section === "seo" ? <SeoPanel /> : null}
            {section === "integrations" ? <IntegrationsPanel /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({ data, onThread }: { data: Overview; onThread: (id: string) => void }) {
  const metrics = [
    ["Profiles", data.metrics.profiles, UsersRound, "#2f6f58"], ["Angel conversations", data.metrics.conversations, Bot, "#5b55a5"],
    ["Awaiting human", data.metrics.waiting, Headphones, "#d65f45"], ["Open tickets", data.metrics.openTickets, TicketCheck, "#b77b21"],
    ["Callbacks", data.metrics.callbacks, CalendarClock, "#34738f"], ["AI requests · 24h", data.metrics.aiRequests24h, Activity, "#6b546f"],
  ] as const;
  return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value, Icon, color]) => <div key={label} className="rounded-md border border-[#dce1dd] bg-white p-5"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded" style={{ background: `${color}14`, color }}><Icon size={19} /></span><span className="text-3xl font-extrabold">{value}</span></div><p className="mt-5 text-xs font-bold text-[#626c67]">{label}</p></div>)}</section><section className="mt-6 rounded-md border border-[#dce1dd] bg-white"><div className="flex items-center justify-between border-b border-[#e4e8e5] px-5 py-4"><div><h2 className="text-sm font-extrabold">Recent Angel conversations</h2><p className="mt-1 text-[10px] text-[#747e79]">Support activity across authenticated accounts</p></div><span className="rounded-full bg-[#edf2ef] px-2.5 py-1 text-[10px] font-bold">Live data</span></div><ConversationRows rows={data.conversations.slice(0, 8)} onThread={onThread} /></section></>;
}

function ConversationsPanel({ data, selected, onThread, onRefresh }: { data: Overview; selected: ThreadDetail | null; onThread: (id: string) => void; onRefresh: () => Promise<void> }) {
  return <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]"><section className="rounded-md border border-[#dce1dd] bg-white"><div className="border-b border-[#e4e8e5] p-4"><h2 className="text-sm font-extrabold">Conversation queue</h2></div><ConversationRows rows={data.conversations} onThread={onThread} /></section><section className="min-h-[660px] rounded-md border border-[#dce1dd] bg-white">{selected ? <ThreadPanel detail={selected} onRefresh={async () => { await onThread(selected.conversation.id); await onRefresh(); }} /> : <div className="grid min-h-[660px] place-items-center p-8 text-center"><div><MessageSquareText className="mx-auto text-[#91a099]" size={34} /><h2 className="mt-4 text-base font-extrabold">Select a conversation</h2><p className="mt-2 text-sm text-[#77817c]">Review context, safety flags, and reply as Sajivo support.</p></div></div>}</section></div>;
}

function ConversationRows({ rows, onThread }: { rows: Overview["conversations"]; onThread: (id: string) => void }) {
  return <div className="divide-y divide-[#ecefeb]">{rows.length ? rows.map((row) => <button key={row.id} onClick={() => void onThread(row.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 text-left hover:bg-[#f7f9f7]"><div className="min-w-0"><p className="truncate text-xs font-extrabold">{row.title}</p><p className="mt-1 truncate text-[10px] text-[#77817c]">{row.account?.full_name || "Account"} · {row.public_id}</p></div><div className="flex items-center gap-2"><Status value={row.status} /><ChevronRight size={14} className="text-[#8d9691]" /></div></button>) : <p className="p-6 text-center text-xs text-[#77817c]">No conversations yet.</p>}</div>;
}

function ThreadPanel({ detail, onRefresh }: { detail: ThreadDetail; onRefresh: () => Promise<void> }) {
  const [reply, setReply] = useState(""); const [sending, setSending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!reply.trim()) return; setSending(true); const response = await fetch(`/api/v2/admin/conversations/${detail.conversation.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: reply }) }); const payload = await response.json().catch(() => ({})); setSending(false); if (!response.ok) { toast.error(payload.error || "Reply failed"); return; } setReply(""); toast.success("Support reply sent"); await onRefresh(); }
  async function setStatus(status: string) { const response = await fetch(`/api/v2/admin/conversations/${detail.conversation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) toast.error(payload.error || "Status update failed"); else { toast.success(`Conversation marked ${status}`); await onRefresh(); } }
  return <div className="flex min-h-[660px] flex-col"><header className="flex flex-wrap items-center gap-3 border-b border-[#e4e8e5] p-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{detail.conversation.title}</p><p className="mt-1 text-[10px] text-[#747f79]">{detail.conversation.public_id}</p></div><select value={detail.conversation.status} onChange={(event) => void setStatus(event.target.value)} className="h-9 rounded border border-[#d5dbd7] bg-white px-2 text-xs font-bold"><option value="open">Open</option><option value="waiting_for_human">Waiting for human</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></header><div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9f7] p-4">{detail.messages.map((message) => <div key={message.id} className={`max-w-[84%] rounded-md border px-4 py-3 text-xs leading-5 shadow-sm ${message.sender === "user" ? "ml-auto border-[#e5aa99] bg-[#fff1ec]" : message.sender === "admin" ? "border-[#9eb5aa] bg-[#edf5f1]" : "border-[#dfe4e0] bg-white"}`}><div className="mb-1 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7c8681]"><span>{message.sender}</span>{message.safety_flags?.length ? <span className="text-red-600">Review risk</span> : null}</div><p className="whitespace-pre-wrap">{message.content}</p></div>)}</div><form onSubmit={submit} className="border-t border-[#dfe4e0] p-4"><div className="flex gap-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} placeholder="Reply as Sajivo support…" className="min-w-0 flex-1 resize-none rounded-md border border-[#cfd6d1] p-3 text-xs outline-none" /><button disabled={sending || !reply.trim()} aria-label="Send support reply" className="grid h-11 w-11 place-items-center rounded-md bg-[#1d2a27] text-white shadow-[0_3px_0_#0c1311] disabled:opacity-40">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}</button></div></form></div>;
}

function TicketsPanel({ data }: { data: Overview }) { return <section className="rounded-md border border-[#dce1dd] bg-white"><header className="border-b border-[#e4e8e5] p-5"><h2 className="text-sm font-extrabold">Open support work</h2><p className="mt-1 text-[10px] text-[#747e79]">Tickets generated by Angel handoff and support workflows</p></header><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#f6f8f6] text-[10px] uppercase text-[#79837e]"><tr><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Account</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y divide-[#ecefeb]">{data.tickets.map((ticket) => <tr key={ticket.id}><td className="px-5 py-4 font-bold">{ticket.public_id}</td><td className="px-5 py-4"><p className="max-w-sm truncate font-semibold">{ticket.subject}</p><p className="mt-1 text-[10px] text-[#7d8682]">{ticket.category}</p></td><td className="px-5 py-4">{ticket.account?.full_name || "Account"}</td><td className="px-5 py-4"><Status value={ticket.priority} /></td><td className="px-5 py-4"><Status value={ticket.status} /></td><td className="px-5 py-4 text-[#6f7974]">{new Date(ticket.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>; }

function KnowledgePanel({ data, selected, onSelect, onRefresh }: { data: Overview; selected: Overview["knowledge"][number] | null; onSelect: (article: Overview["knowledge"][number] | null) => void; onRefresh: () => Promise<void> }) {
  return <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]"><section className="rounded-md border border-[#dce1dd] bg-white"><header className="border-b border-[#e4e8e5] p-4"><h2 className="text-sm font-extrabold">Approved articles</h2><p className="mt-1 text-[10px] text-[#76807b]">Versioned knowledge supplied to Angel</p></header><div className="divide-y divide-[#ecefeb]">{data.knowledge.map((article) => <button key={article.id} onClick={() => onSelect(article)} className={`w-full px-4 py-4 text-left ${selected?.id === article.id ? "bg-[#eef3ef]" : "hover:bg-[#f7f9f7]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-extrabold">{article.title}</p><Status value={article.status} /></div><p className="mt-2 text-[10px] text-[#75807a]">{article.category} · v{article.version} · {article.locale.toUpperCase()}</p></button>)}</div></section><section className="rounded-md border border-[#dce1dd] bg-white">{selected ? <ArticleEditor article={selected} onSaved={async () => { await onRefresh(); onSelect(null); }} /> : <div className="grid min-h-[560px] place-items-center p-8 text-center"><div><BookOpenCheck className="mx-auto text-[#90a098]" size={34} /><h2 className="mt-4 font-extrabold">Select a knowledge article</h2><p className="mt-2 text-sm text-[#76807b]">Review, edit, and publish controlled Angel guidance.</p></div></div>}</section></div>;
}

function ArticleEditor({ article, onSaved }: { article: Overview["knowledge"][number]; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget); const response = await fetch(`/api/v2/admin/knowledge/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), category: form.get("category"), locale: form.get("locale"), summary: form.get("summary"), body: form.get("body"), status: form.get("status"), keywords: String(form.get("keywords") || "").split(",").map((item) => item.trim()).filter(Boolean) }) }); const payload = await response.json().catch(() => ({})); setSaving(false); if (!response.ok) { toast.error(payload.error || "Article could not be saved"); return; } toast.success("Knowledge article updated"); await onSaved(); }
  const input = "mt-1 w-full rounded-md border border-[#d5dcd7] bg-white px-3 text-xs outline-none focus:border-[#829189]";
  return <form key={article.id} onSubmit={save} className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7eae8] pb-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#d65f45]">Knowledge editor</p><h2 className="mt-1 text-lg font-extrabold">{article.title}</h2></div><span className="text-[10px] text-[#78827d]">Version {article.version}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-bold sm:col-span-2">Title<input name="title" defaultValue={article.title} className={`${input} h-10`} /></label><label className="text-[10px] font-bold">Category<select name="category" defaultValue={article.category} className={`${input} h-10`}><option>account</option><option>projects</option><option>subscriptions</option><option>credits</option><option>payments</option><option>communication</option><option>security</option><option>support</option></select></label><label className="text-[10px] font-bold">Language<select name="locale" defaultValue={article.locale} className={`${input} h-10`}><option value="en">English</option><option value="hi">Hindi</option></select></label><label className="text-[10px] font-bold sm:col-span-2">Summary<textarea name="summary" defaultValue={article.summary} rows={2} className={`${input} resize-none p-3`} /></label><label className="text-[10px] font-bold sm:col-span-2">Approved answer<textarea name="body" defaultValue={article.body} rows={9} className={`${input} resize-y p-3 leading-5`} /></label><label className="text-[10px] font-bold sm:col-span-2">Keywords<input name="keywords" defaultValue={article.keywords.join(", ")} className={`${input} h-10`} /></label><label className="text-[10px] font-bold">Status<select name="status" defaultValue={article.status} className={`${input} h-10`}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><div className="mt-6 flex justify-end"><button disabled={saving} className="flex h-10 items-center gap-2 rounded-md bg-[#1d2a27] px-4 text-xs font-bold text-white shadow-[0_3px_0_#0c1311] disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}Save article</button></div></form>;
}

function Status({ value }: { value: string }) { const warm = /waiting|urgent|open|draft/.test(value); const good = /published|resolved|closed|normal/.test(value); return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-extrabold ${warm ? "bg-[#fff0eb] text-[#b74c36]" : good ? "bg-[#eaf6f0] text-[#2d765b]" : "bg-[#eef1ef] text-[#62706a]"}`}>{value.replaceAll("_", " ")}</span>; }
function Forbidden() { return <div className="grid min-h-[calc(100vh-70px)] place-items-center bg-[#f2f4f2] p-6"><div className="max-w-md rounded-md border border-[#dce1dd] bg-white p-8 text-center"><CircleAlert className="mx-auto text-[#d65f45]" size={34} /><h1 className="mt-4 text-xl font-extrabold">Super-admin access required</h1><p className="mt-3 text-sm leading-6 text-[#6e7873]">This page checks the server-authoritative Supabase admin registry. A normal profile role cannot open the control room.</p><Link href="/v2" className="mt-6 inline-flex h-10 items-center rounded-md bg-[#1d2a27] px-4 text-xs font-bold text-white">Return to Sajivo</Link></div></div>; }
