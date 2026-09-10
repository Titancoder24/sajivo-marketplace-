"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BulkSeoGenerator } from "./BulkSeoGenerator";

type Template = { slug: string; serviceName: string; intent: string };
type Job = { id: string; requested_count: number; generated_count: number; status: string; created_at: string };

export function BulkSeoStudioPanel() {
  const [templates, setTemplates] = useState<Template[]>([]); const [jobs, setJobs] = useState<Job[]>([]); const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); const response = await fetch("/api/v2/admin/seo", { cache: "no-store" }); const payload = await response.json(); setLoading(false); if (!response.ok) toast.error(payload.error || "SEO studio could not be loaded"); else { setTemplates(payload.templates || []); setJobs(payload.jobs || []); } }
  useEffect(() => { void load(); }, []);
  if (loading && !templates.length) return <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin"/></div>;
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"><BulkSeoGenerator templates={templates} onCreated={load}/><section className="h-fit rounded-md border border-[#dce1dd] bg-white"><header className="border-b border-[#e5e9e6] p-5"><h2 className="text-sm font-extrabold">Generation audit log</h2><p className="mt-1 text-[10px] text-[#75807a]">Every bulk request is recorded in Supabase.</p></header><div className="divide-y divide-[#edf0ee]">{jobs.map((job)=><div key={job.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-5 text-xs"><div><b>{job.generated_count} of {job.requested_count} drafts</b><p className="mt-1 text-[10px] text-[#7b8580]">{new Date(job.created_at).toLocaleString()}</p></div><span className="h-fit rounded-full bg-[#edf3ef] px-2 py-1 text-[9px] font-bold capitalize">{job.status}</span></div>)}{!jobs.length?<p className="p-6 text-xs text-[#75807a]">No bulk generation jobs yet.</p>:null}</div></section></div>;
}
