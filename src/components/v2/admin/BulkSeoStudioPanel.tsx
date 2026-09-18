"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BulkSeoGenerator } from "./BulkSeoGenerator";
import { SeoPagesTable, type SeoPage } from "./AdminGrowthPanels";

type Template = { slug: string; serviceName: string; intent: string };
type Job = { id: string; requested_count: number; generated_count: number; status: string; created_at: string };

export function BulkSeoStudioPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/v2/admin/seo", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "SEO studio could not be loaded");
      setTemplates(payload.templates || []);
      setJobs(payload.jobs || []);
      setPages(payload.pages || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SEO studio could not be loaded");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading && !templates.length) return <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin"/></div>;
  return <div className="space-y-5">
    {error && <p role="alert" className="text-sm text-[#b84e37]">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <BulkSeoGenerator templates={templates} onCreated={load}/>
      <section className="h-fit border border-[#dce1dd] bg-white">
        <header className="border-b border-[#e5e9e6] p-5"><h2 className="text-sm font-extrabold">Generation audit log</h2></header>
        <div className="divide-y divide-[#edf0ee]">
          {jobs.map((job) => <div key={job.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-5 text-xs">
            <div><b>{job.generated_count} of {job.requested_count} drafts created</b><p className="mt-1 text-[10px] text-[#7b8580]">{new Date(job.created_at).toLocaleString()}</p></div>
            <span className="h-fit bg-[#edf3ef] px-2 py-1 text-[9px] font-bold capitalize">{job.status}</span>
          </div>)}
          {!jobs.length && <p className="p-6 text-xs text-[#75807a]">No bulk generation jobs yet.</p>}
        </div>
      </section>
    </div>
    <SeoPagesTable pages={pages} loading={loading} onRefresh={() => void load()} onUpdated={(updated) => setPages((current) => current.map((page) => page.id === updated.id ? updated : page))}/>
  </div>;
}
