"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Mail, Phone, Save } from "lucide-react";
import { toast } from "sonner";

type Settings = { phone_number: string | null; email_address: string | null; show_phone: boolean; show_email: boolean };

export function ContactSettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void fetch("/api/v2/admin/contact", { cache: "no-store" }).then(async (r) => ({ ok: r.ok, payload: await r.json() })).then(({ok,payload}) => { if (!ok) toast.error(payload.error || "Contact settings could not be loaded"); setSettings(payload.settings || { phone_number: null, email_address: null, show_phone: false, show_email: false }); }); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v2/admin/contact", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: String(form.get("phone") || "") || null, emailAddress: String(form.get("email") || "") || null, showPhone: form.get("showPhone") === "on", showEmail: form.get("showEmail") === "on" }) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) toast.error(payload.error || "Contact settings could not be saved"); else { setSettings(payload.settings); toast.success("Global contact settings saved"); }
  }
  if (!settings) return <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin" /></div>;
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><form onSubmit={save} className="rounded-md border border-[#dce1dd] bg-white p-6"><h2 className="text-base font-extrabold">Universal lead contact</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#68736d]">Control the phone number and email shown above every public page. Disabled fields are never rendered to visitors.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><ContactField icon={Phone} name="phone" label="Phone number" defaultValue={settings.phone_number || ""} placeholder="+91 98765 43210" toggle="showPhone" enabled={settings.show_phone}/><ContactField icon={Mail} name="email" label="Lead email" defaultValue={settings.email_address || ""} placeholder="hello@sajivo.com" toggle="showEmail" enabled={settings.show_email}/></div><button disabled={saving} className="mt-7 flex h-11 items-center gap-2 rounded-md bg-[#d65f45] px-5 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b] disabled:opacity-50">{saving?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}Save global contact</button></form><aside className="h-fit rounded-md border border-[#ccd8d1] bg-[#17211d] p-6 text-white"><p className="text-[10px] font-extrabold uppercase text-[#f08b72]">Live placement</p><h2 className="mt-3 text-lg font-extrabold">Public header contact strip</h2><p className="mt-3 text-xs leading-6 text-white/65">Phone and email become clickable <code>tel:</code> and <code>mailto:</code> links. Super-admin and authenticated workspace chrome remain private and uncluttered.</p></aside></div>;
}

function ContactField({icon:Icon,name,label,defaultValue,placeholder,toggle,enabled}:{icon:typeof Phone;name:string;label:string;defaultValue:string;placeholder:string;toggle:string;enabled:boolean}) {
  return <fieldset className="rounded-md border border-[#dce1dd] p-4"><label className="text-[10px] font-bold">{label}<span className="mt-2 flex h-11 items-center gap-2 rounded border border-[#d5dcd7] px-3"><Icon size={15} className="text-[#718078]"/><input name={name} defaultValue={defaultValue} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-xs outline-none"/></span></label><label className="mt-4 flex items-center justify-between gap-3 text-xs font-bold">Show globally<input name={toggle} type="checkbox" defaultChecked={enabled} className="h-4 w-4 accent-[#d65f45]"/></label></fieldset>;
}
