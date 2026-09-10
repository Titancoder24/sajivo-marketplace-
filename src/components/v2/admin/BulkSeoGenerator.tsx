"use client";

import { FormEvent, useState } from "react";
import { Layers3, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Template = { slug: string; serviceName: string; intent: string };

export function BulkSeoGenerator({ templates, onCreated }: { templates: Template[]; onCreated: () => Promise<void> }) {
  const [creating, setCreating] = useState(false);
  const [target, setTarget] = useState(100);
  const defaultLocations = "Uttar Pradesh | Lucknow\nUttar Pradesh | Noida\nMaharashtra | Mumbai\nKarnataka | Bengaluru\nTelangana | Hyderabad\nTamil Nadu | Chennai\nDelhi | New Delhi\nRajasthan | Jaipur\nGujarat | Ahmedabad\nWest Bengal | Kolkata";
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const locations = String(form.get("locations") || "").split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts.length === 2 && parts.every(Boolean)).map(([stateName, cityName]) => ({ stateName, cityName }));
    const serviceSlugs = form.getAll("services").map(String);
    setCreating(true); const response = await fetch("/api/v2/admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "bulk", locations, serviceSlugs, limit: target }) }); const payload = await response.json(); setCreating(false);
    if (!response.ok) toast.error(payload.error || "Bulk generation failed"); else { toast.success(`${payload.generated} review drafts generated`); await onCreated(); }
  }
  return <form onSubmit={create} className="rounded-md border border-[#dce1dd] bg-white p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-[#edf3ef] text-[#355548]"><Layers3 size={18}/></span><div><h2 className="text-sm font-extrabold">Bulk SEO · GEO · AEO studio</h2><p className="mt-1 text-[10px] leading-4 text-[#75807a]">Generate up to 2,000 quality-review drafts from location and intent combinations.</p></div></div><label className="mt-5 block text-[10px] font-bold">Locations · one “State | City” per line<textarea name="locations" defaultValue={defaultLocations} rows={6} className="mt-1 w-full resize-y rounded border border-[#d5dcd7] p-3 font-mono text-[10px] outline-none"/></label><fieldset className="mt-4"><legend className="text-[10px] font-bold">Approved intent templates</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{templates.map((template)=><label key={template.slug} className="flex items-center gap-2 rounded border border-[#e0e5e1] px-3 py-2 text-[10px] font-semibold"><input type="checkbox" name="services" value={template.slug} defaultChecked className="accent-[#d65f45]"/><span className="min-w-0 truncate">{template.serviceName}</span></label>)}</div></fieldset><div className="mt-4"><p className="text-[10px] font-bold">Maximum drafts</p><div className="mt-2 grid grid-cols-4 gap-2">{[100,500,1000,2000].map((value)=><button key={value} type="button" onClick={()=>setTarget(value)} className={`h-9 rounded border text-xs font-bold ${target===value?"border-[#d65f45] bg-[#fff0eb] text-[#b54832]":"border-[#d5dcd7]"}`}>{value}</button>)}</div></div><button disabled={creating} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#17211d] text-xs font-bold text-white disabled:opacity-50">{creating?<Loader2 size={15} className="animate-spin"/>:<Layers3 size={15}/>}Generate review drafts</button><p className="mt-3 text-[10px] leading-4 text-[#7b8580]">Drafts are excluded from indexing and sitemaps until reviewed and published. This protects visitors and follows Google’s people-first and scaled-content guidance.</p></form>;
}
