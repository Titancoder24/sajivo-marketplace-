"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2, Pencil, Save, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  account_status: string | null;
  verification_status: string | null;
  account_public_id: string | null;
};

const inputClass = "h-11 w-full rounded-md border border-[#d9dfdb] bg-white px-3 text-sm outline-none transition focus:border-[#d65f45] focus:ring-2 focus:ring-[#d65f45]/15 disabled:bg-[#f4f6f4] disabled:text-[#76807b]";

export function ClientProfileEditor({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initials = profile.full_name?.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "SJ";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v2/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        city: form.get("city"),
        state: form.get("state"),
        bio: form.get("bio"),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Profile could not be saved.");
      return;
    }
    setProfile(payload.profile);
    setEditing(false);
    toast.success("Profile saved to your Sajivo account.");
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border-b border-[#e3e7e4] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-extrabold text-[#1d2824]">Profile</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7772]">Identity and contact information stored for this authenticated Sajivo account.</p></div>
      {!editing ? <button type="button" onClick={() => setEditing(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8ded9] bg-white px-4 text-xs font-bold shadow-sm"><Pencil size={14}/>Edit profile</button> : null}
    </header>

    <section className="grid gap-6 border border-[#dfe5e1] bg-white p-5 sm:p-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-[#e8ece9] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#1d2a27] text-lg font-extrabold text-white">{initials}</span>
        <h2 className="mt-4 text-lg font-extrabold">{profile.full_name || "Sajivo customer"}</h2>
        <p className="mt-1 text-xs text-[#73807a]">{profile.account_public_id || "Account ID pending"}</p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#edf5f0] px-3 py-1.5 text-[10px] font-bold capitalize text-[#35604d]"><ShieldCheck size={13}/>{profile.verification_status || "unverified"}</span>
      </aside>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className={inputClass} name="fullName" defaultValue={profile.full_name || ""} disabled={!editing} required /></Field>
        <Field label="Email address"><input className={inputClass} value={profile.email || ""} disabled aria-describedby="email-note" /><span id="email-note" className="mt-1 block text-[10px] text-[#7b8580]">Managed through account security.</span></Field>
        <Field label="Phone number"><input className={inputClass} name="phone" defaultValue={profile.phone || ""} disabled={!editing} /></Field>
        <Field label="City"><input className={inputClass} name="city" defaultValue={profile.city || ""} disabled={!editing} /></Field>
        <Field label="State"><input className={inputClass} name="state" defaultValue={profile.state || ""} disabled={!editing} /></Field>
        <Field label="Account status"><input className={`${inputClass} capitalize`} value={profile.account_status || "active"} disabled /></Field>
        <label className="grid gap-2 text-xs font-bold sm:col-span-2">About you<textarea className="min-h-28 w-full resize-y rounded-md border border-[#d9dfdb] bg-white p-3 text-sm font-normal leading-6 outline-none focus:border-[#d65f45] focus:ring-2 focus:ring-[#d65f45]/15 disabled:bg-[#f4f6f4]" name="bio" defaultValue={profile.bio || ""} disabled={!editing} maxLength={1000}/></label>
        {editing ? <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={() => setEditing(false)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8ded9] bg-white px-4 text-xs font-bold"><X size={14}/>Cancel</button>
          <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#d65f45] px-4 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b] disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>}Save profile</button>
        </div> : <div className="flex items-center gap-2 text-xs font-semibold text-[#3f7059] sm:col-span-2"><Check size={15}/>Saved information is visible only in your authenticated account.</div>}
      </form>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold">{label}<span className="mt-2 block">{children}</span></label>;
}
