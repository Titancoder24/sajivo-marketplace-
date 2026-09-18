"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, Save } from "lucide-react";

const input = "w-full rounded border border-[#ccd5cf] bg-white p-2 text-sm";
const button = "inline-flex items-center justify-center gap-2 rounded border border-[#ccd5cf] bg-white p-2 text-sm disabled:opacity-40";
type Account = { id: string; full_name: string | null; email: string | null; phone: string | null; city: string | null; primary_role: string; account_status: string; account_public_id: string; updated_at: string; protected?: boolean };

function Pagination({ page, total, change, disabled = false }: { page: number; total: number; change: (page: number) => void; disabled?: boolean }) {
  return <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{total} records · Page {page}</span><div className="flex gap-2"><button className={button} disabled={disabled || page <= 1} onClick={() => change(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button><button className={button} disabled={disabled || page * 25 >= total} onClick={() => change(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>;
}

export function AccountsPanel() {
  const [rows, setRows] = useState<Account[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/v2/admin/accounts?page=${page}&search=${encodeURIComponent(query)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const data = await response.json(); if (controller.signal.aborted) return; if (!response.ok) throw new Error(data.error); setRows(data.accounts); setTotal(data.total); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message || "Accounts unavailable"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, revision]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || saving) return;
    const form = new FormData(event.currentTarget);
    if (form.get("account_status") === "suspended" && selected.account_status !== "suspended" && !window.confirm("Suspend this account's application access?")) return;
    setSaving(true); setError(""); setConflict(false);
    try {
      const response = await fetch("/api/v2/admin/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, expectedUpdatedAt: selected.updated_at, full_name: form.get("full_name"), phone: form.get("phone"), city: form.get("city"), account_status: form.get("account_status") }) });
      const data = await response.json(); if (!response.ok) { setConflict(response.status === 409); throw new Error(data.error); }
      setSelected(null); setRevision(value => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Account update failed"); }
    finally { setSaving(false); }
  }
  return <section>
    <form onSubmit={event => { event.preventDefault(); if (saving) return; setPage(1); setQuery(search); }} className="mb-5 flex gap-2"><input className={input} disabled={saving} aria-label="Search accounts" placeholder="Search name, email or account ID" value={search} onChange={event => setSearch(event.target.value)} /><button className={button} disabled={saving} aria-label="Search"><Search size={18} /></button><button type="button" className={button} disabled={saving} aria-label="Refresh accounts" onClick={() => setRevision(value => value + 1)}><RefreshCw size={18} /></button></form>
    {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {conflict && <button type="button" className={button} disabled={saving} onClick={() => { setSelected(null); setConflict(false); setRevision(value => value + 1); }}><RefreshCw size={16} />Reload accounts</button>}
    {selected && <form key={selected.id} onSubmit={save} className="mb-6 grid gap-4 border-y border-[#ccd5cf] py-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Edit {selected.account_public_id || selected.email}</h2><label>Name<input name="full_name" className={input} defaultValue={selected.full_name || ""} required minLength={2} maxLength={120} /></label><label>Phone<input name="phone" className={input} defaultValue={selected.phone || ""} maxLength={30} /></label><label>City<input name="city" className={input} defaultValue={selected.city || ""} maxLength={100} /></label><label>Account status<select name="account_status" className={input} defaultValue={selected.account_status}><option value="active">Active</option><option value="suspended">Suspended</option></select></label><div className="flex gap-3 sm:col-span-2"><button className={button} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save account"}</button><button type="button" className={button} disabled={saving} onClick={() => setSelected(null)}>Cancel</button></div></form>}
    {loading ? <p role="status">Loading accounts...</p> : !error && <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">Account</th><th className="p-3">Contact</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b border-[#d9dfdb]"><td className="p-3"><p className="font-semibold">{row.full_name || "Name not supplied"}</p><p className="text-xs">{row.account_public_id}</p></td><td className="p-3"><p>{row.email || "No email"}</p><p>{row.phone || "No phone"}</p></td><td className="p-3">{row.primary_role}</td><td className="p-3">{row.account_status}</td><td className="p-3"><button className={button} disabled={row.protected || saving} onClick={() => setSelected(row)}>{row.protected ? "Protected admin" : "Edit"}</button></td></tr>)}</tbody></table>{!rows.length && <p className="py-8">No matching accounts.</p>}<Pagination page={page} total={total} change={setPage} disabled={saving} /></div>}
  </section>;
}

type SupportRow = { id: string; public_id: string; reason?: string; subject?: string; status: string; preferred_date?: string; time_window?: string; timezone?: string; communication_method?: string; contact_name?: string; contact_phone?: string; contact_email?: string; account: Account | null };
export function SupportWorkPanel({ kind }: { kind: "tickets" | "callbacks" }) {
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const mutationPending = useRef(false);
  useEffect(() => {
    if (mutationPending.current) return;
    const version = ++requestVersion.current;
    const controller = new AbortController(); setLoading(true); setError("");
    const current = () => !controller.signal.aborted && version === requestVersion.current;
    fetch(`/api/v2/admin/support-work?kind=${kind}&page=${page}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!current()) return; if (!response.ok) throw new Error(data.error); setRows(data.rows); setTotal(data.total); })
      .catch(reason => { if (current()) { setRows([]); setError(reason.message || "Support requests unavailable"); } })
      .finally(() => { if (current()) setLoading(false); });
    return () => controller.abort();
  }, [kind, page, revision]);
  async function update(id: string, status: string) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    // Invalidate reads started before this write, even if their body arrives later.
    ++requestVersion.current;
    setLoading(false); setSaving(id); setError("");
    try { const response = await fetch("/api/v2/admin/support-work", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, status }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setRows(current => current.map(row => row.id === id ? { ...row, status: data.request.status } : row)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Status update failed"); }
    finally { mutationPending.current = false; setSaving(null); }
  }
  const statuses = kind === "callbacks" ? ["requested", "confirmed", "completed", "cancelled"] : ["open", "pending", "resolved", "closed"];
  return <section><div className="mb-4 flex justify-end"><button className={button} disabled={saving !== null} aria-label="Refresh requests" onClick={() => { if (!mutationPending.current) setRevision(value => value + 1); }}><RefreshCw size={18} /></button></div>{error && <p role="alert" className="mb-4 bg-red-50 p-3 text-red-800">{error}</p>}{loading ? <p role="status">Loading requests...</p> : <><div className="divide-y divide-[#cfd8d1]">{rows.map(row => { const phone = row.contact_phone || row.account?.phone; const email = row.contact_email || row.account?.email; return <article key={row.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_180px]"><div className="min-w-0"><p className="text-xs text-[#5f6d65]">{row.public_id}</p><h2 className="mt-1 break-words font-semibold">{row.subject || row.reason}</h2>{row.preferred_date && <p className="mt-2 text-sm">{row.preferred_date} · {row.time_window} · {row.timezone}<br />{row.communication_method}</p>}</div><div className="min-w-0 break-words text-sm"><p className="font-bold">{row.contact_name || row.account?.full_name || "Name not supplied"}</p>{phone ? <a className="mt-1 block underline" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : <p>Phone not supplied</p>}{email ? <a className="mt-1 block underline" href={`mailto:${email}`}>{email}</a> : <p>Email not supplied</p>}<p className="mt-1 text-xs">{row.account?.account_public_id}</p></div><label className="text-sm">Status<select aria-label={`Status for ${row.public_id}`} className={`${input} mt-1`} value={row.status} disabled={saving !== null} onChange={event => void update(row.id, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select>{saving === row.id && <span role="status">Saving...</span>}</label></article>; })}</div>{!rows.length && <p className="py-8">No {kind} yet.</p>}<Pagination page={page} total={total} change={setPage} disabled={saving !== null} /></>}</section>;
}
