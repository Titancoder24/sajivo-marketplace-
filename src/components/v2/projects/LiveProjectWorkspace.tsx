"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, FileText, FolderOpen, LayoutDashboard, ListChecks, MapPin, Plus, Users } from "lucide-react";
import { ProjectTasks } from "./ProjectTasks";
import { ProjectFiles } from "./ProjectFiles";
import { ProjectTeam } from "./ProjectTeam";

export type LiveProject = {
  id: string; title: string | null; description: string | null; status: string;
  scope: Record<string, unknown> | null; services: string[] | null;
  city: string | null; state: string | null; locality: string | null;
  budget_range: string | null; custom_budget: number | null;
  preferred_start_date: string | null; expected_timeline: string | null;
  created_at: string; updated_at: string;
};
type Counts = { tasks: number; files: number; team: number; milestones: number };
type Tab = "Overview" | "Tasks" | "Files" | "Team";
const tabs = [["Overview", LayoutDashboard], ["Tasks", ListChecks], ["Files", FolderOpen], ["Team", Users]] as const;
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export function LiveProjectWorkspace({ project, counts }: { project: LiveProject; counts: Counts }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const scopeLabel = typeof project.scope?.label === "string" ? project.scope.label : "Not specified";
  const location = [project.locality, project.city, project.state].filter(Boolean).join(", ") || "Location not specified";
  const totalActivity = counts.tasks + counts.files + counts.team + counts.milestones;
  return <div className="min-h-[calc(100vh-76px)] bg-[#f6f7f5] text-[#202521]">
    <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="hidden min-h-[calc(100vh-76px)] border-r border-[#e0e5e2] bg-white p-4 lg:block">
        <Link href="/v2/client/projects" className="flex h-10 items-center gap-2 px-2 text-xs font-bold text-[#68736d]"><ArrowLeft size={14} /> My projects</Link>
        <div className="mt-3 border-y border-[#e5e9e6] py-4"><p className="truncate text-sm font-extrabold">{project.title || "Untitled project"}</p><p className="mt-1 text-[10px] font-semibold uppercase text-[#7b857f]">{project.status.replaceAll("_", " ")}</p></div>
        <nav className="mt-4 grid gap-1" aria-label="Project workspace">{tabs.map(([label, Icon]) => <button key={label} type="button" onClick={() => setTab(label)} className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-bold ${tab === label ? "bg-[#edf2ef] text-[#294e3d]" : "text-[#66706b] hover:bg-[#f5f7f5]"}`}><Icon size={17} />{label}</button>)}</nav>
      </aside>
      <main className="min-w-0">
        <header className="border-b border-[#e0e5e2] bg-white px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-extrabold sm:text-2xl">{project.title || "Untitled project"}</h1><span className="rounded-full bg-[#edf3ef] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#446454]">{project.status.replaceAll("_", " ")}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs text-[#737e78]"><MapPin size={13} />{location}</p></div><p className="text-xs text-[#7a847f]">Updated {date(project.updated_at)}</p></div>
          <nav className="-mb-5 mt-4 flex overflow-x-auto lg:hidden" aria-label="Project views">{tabs.map(([label, Icon]) => <button key={label} type="button" onClick={() => setTab(label)} className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-bold ${tab === label ? "border-[#d65f45] text-[#bd482f]" : "border-transparent text-[#6f7974]"}`}><Icon size={14} />{label}</button>)}</nav>
        </header>
        <div className="p-4 sm:p-6">
          {tab === "Overview" && <div className="grid gap-4">
            <section className="grid gap-px overflow-hidden rounded-md border border-[#e0e5e2] bg-[#e0e5e2] sm:grid-cols-2 xl:grid-cols-4">
              {[[ListChecks, counts.tasks, "Tasks", "Tasks"], [FolderOpen, counts.files, "Files", "Files"], [Users, counts.team, "Team members", "Team"], [CalendarDays, counts.milestones, "Milestones", null]].map(([Icon, value, label, destination]) => { const ItemIcon = Icon as typeof ListChecks; return <button type="button" disabled={!destination} key={label as string} onClick={() => destination && setTab(destination as Tab)} className="flex min-h-24 items-center gap-3 bg-white p-4 text-left disabled:cursor-default"><span className="grid h-10 w-10 place-items-center rounded-md bg-[#edf2ef] text-[#4b6257]"><ItemIcon size={18} /></span><span><strong className="block text-xl">{value as number}</strong><span className="text-xs text-[#737d78]">{label as string}</span></span></button>; })}
            </section>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-md border border-[#e0e5e2] bg-white p-5"><h2 className="text-base font-extrabold">Project brief</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#626d67]">{project.description || "No project description has been added."}</p><dl className="mt-6 grid gap-4 border-t border-[#edf0ee] pt-5 sm:grid-cols-2"><div><dt className="text-[10px] font-bold uppercase text-[#87908b]">Scope</dt><dd className="mt-1 text-sm font-semibold">{scopeLabel}</dd></div><div><dt className="text-[10px] font-bold uppercase text-[#87908b]">Timeline</dt><dd className="mt-1 text-sm font-semibold">{project.expected_timeline || "Not specified"}</dd></div><div><dt className="text-[10px] font-bold uppercase text-[#87908b]">Budget</dt><dd className="mt-1 text-sm font-semibold">{project.custom_budget ? money(project.custom_budget) : project.budget_range || "Not specified"}</dd></div><div><dt className="text-[10px] font-bold uppercase text-[#87908b]">Preferred start</dt><dd className="mt-1 text-sm font-semibold">{project.preferred_start_date ? date(project.preferred_start_date) : "Not specified"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2">{project.services?.length ? project.services.map((service) => <span key={service} className="rounded-full bg-[#f0f3f1] px-3 py-1.5 text-[10px] font-bold">{service}</span>) : <span className="text-xs text-[#7b857f]">No services selected.</span>}</div></article>
              <aside className="rounded-md border border-[#e0e5e2] bg-white p-5"><CircleDollarSign size={21} className="text-[#52675d]" /><h2 className="mt-4 text-base font-extrabold">Project record</h2><p className="mt-2 text-xs leading-5 text-[#707a75]">Created {date(project.created_at)}. Activity shown here comes from this project&apos;s Supabase records.</p><Link href="/v2/client/documents-payments" className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#d9dfdb] text-xs font-bold hover:bg-[#f7f8f7]"><FileText size={14} /> Documents and payments</Link></aside>
            </section>
            {totalActivity === 0 && <section className="rounded-md border border-dashed border-[#ced6d1] bg-white p-8 text-center"><CheckCircle2 className="mx-auto text-[#4c7561]" size={28} /><h2 className="mt-4 text-lg font-extrabold">Workspace ready for real activity</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6d7772]">No milestones, tasks, files or team members have been recorded yet. Start with the first project task.</p><button type="button" onClick={() => setTab("Tasks")} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#d65f45] px-4 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b]"><Plus size={15} /> Add the first task</button></section>}
          </div>}
          {tab === "Tasks" && <ProjectTasks projectId={project.id} />}
          {tab === "Files" && <ProjectFiles projectId={project.id} />}
          {tab === "Team" && <ProjectTeam projectId={project.id} />}
        </div>
      </main>
    </div>
  </div>;
}
