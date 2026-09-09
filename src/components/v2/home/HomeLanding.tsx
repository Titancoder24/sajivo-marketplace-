"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Blocks, BriefcaseBusiness, Building2, Check, ClipboardCheck, FileText, Hammer, Handshake, Layers3, MapPin, MessageSquareText, PaintRoller, PanelTop, Save, Search, ShieldCheck, Sparkles, WalletCards, X, type LucideIcon } from "lucide-react";

type Category = { title: string; description: string; icon: LucideIcon; href: string };
const categories: Category[] = [
  { title: "Full home interiors", description: "Plan every space in one coordinated brief.", icon: Layers3, href: "/services/full-home-interior-design" },
  { title: "Modular kitchen", description: "Define layouts, finishes, hardware and scope.", icon: BriefcaseBusiness, href: "/services/modular-kitchen" },
  { title: "Architecture", description: "Find the right planning and design expertise.", icon: Building2, href: "/professionals" },
  { title: "Renovation", description: "Structure repairs, upgrades and execution clearly.", icon: Hammer, href: "/services/end-to-end-execution" },
  { title: "False ceiling", description: "Plan ceiling systems, lighting and performance.", icon: PanelTop, href: "/services/false-ceiling" },
  { title: "Wall finishes", description: "Compare panels, materials and installation needs.", icon: PaintRoller, href: "/services/wall-paneling" },
];
const trustItems = [
  [ShieldCheck, "Verified professionals", "Review identity, business and portfolio information before appointing."],
  [FileText, "Structured proposals", "Compare scope, pricing, timelines and deliverables in one format."],
  [Handshake, "Connected delivery", "Keep milestones, files, decisions and people attached to the project."],
  [WalletCards, "Traceable records", "Maintain a clear history of documents, invoices and payments."],
] as const;
const workflow = [
  [MessageSquareText, "Create your brief", "Choose the project scope and add your actual requirements, budget, location and timeline."],
  [Sparkles, "Receive relevant proposals", "Eligible professionals respond to the published requirement with their own scope and terms."],
  [ClipboardCheck, "Compare and appoint", "Review profiles and proposals before selecting the professional that fits the work."],
  [Blocks, "Manage the real project", "Use one workspace for tasks, files, team members, communication and project records."],
] as const;
type WorkPhoto = { id?: string; title: string; type: string; city: string; image: string; featured?: boolean; professionalId?: string };
const propertyViews: ReadonlyArray<WorkPhoto> = [
  { title: "Warm minimal apartment", type: "Full home interior", city: "Bengaluru", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=86", featured: true },
  { title: "Contemporary city residence", type: "Design and execution", city: "Mumbai", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86", featured: true },
  { title: "Quiet luxury living room", type: "Living room", city: "Bengaluru", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=84" },
  { title: "Natural light kitchen", type: "Modular kitchen", city: "Mumbai", image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1000&q=84" },
  { title: "Soft modern bedroom", type: "Bedroom interior", city: "Pune", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=84" },
  { title: "Calm family lounge", type: "Renovation", city: "Hyderabad", image: "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1000&q=84" },
  { title: "Crafted dining space", type: "Interior design", city: "Delhi NCR", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=84" },
  { title: "Layered neutral home", type: "Full home interior", city: "Chennai", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=84" },
  { title: "Indoor-outdoor residence", type: "Architecture", city: "Bengaluru", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=84" },
  { title: "Comfort-led living", type: "Furniture and finishes", city: "Mumbai", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=84" },
];

const materialPreviews = [
  { name: "PVC wall panels", detail: "Water-resistant decorative wall finish", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82" },
  { name: "Natural stone", detail: "Durable flooring, counters and feature surfaces", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82" },
  { name: "Engineered wood", detail: "Warm, stable finish for cabinetry and flooring", image: "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=900&q=82" },
  { name: "Textured paint", detail: "Low-build decorative finish for feature walls", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=82" },
] as const;

export function HomeLanding({ workPhotos = [] }: { workPhotos?: WorkPhoto[] }) {
  const visibleWork: ReadonlyArray<WorkPhoto> = workPhotos.length ? workPhotos : propertyViews;
  const [selectedWork, setSelectedWork] = useState<WorkPhoto | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<(typeof materialPreviews)[number] | null>(materialPreviews[0]);

  async function saveInspiration(item: WorkPhoto) {
    const response = await fetch("/api/v2/inspirations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: item.title, imageUrl: item.image, city: item.city, projectType: item.type }) });
    if (response.status === 401) { window.location.href = `/login?next=${encodeURIComponent("/v2")}`; return; }
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error ?? "Unable to save this inspiration"); return; }
    toast.success("Saved to your inspiration gallery");
  }

  return <main className="min-h-screen bg-[#fafaf9] text-[#171b20]">
    <section className="mx-auto max-w-[1480px] px-4 pb-14 pt-4 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[580px] overflow-hidden rounded-md bg-[#17201d] text-white">
        <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90" alt="Completed contemporary residential interior" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,16,13,.92)_0%,rgba(8,16,13,.62)_50%,rgba(8,16,13,.16)_100%)]" />
        <div className="relative flex w-full flex-col justify-end p-6 sm:p-10 lg:p-14">
          <p className="text-xs font-extrabold uppercase text-[#ffb29d]">Plan. Compare. Build.</p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.4rem,5.3vw,5rem)] font-extrabold leading-[1.02]">Every detail, from first brief to final handover.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">Create a real project requirement, receive structured proposals, appoint a professional and manage delivery in one connected workspace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/v2/projects/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#d65f45] px-6 text-sm font-extrabold text-white shadow-[0_4px_0_#9f3d2b] hover:bg-[#c95139]">Start your brief <ArrowRight size={17} /></Link>
            <Link href="/professionals" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/35 bg-black/25 px-6 text-sm font-bold text-white backdrop-blur hover:bg-black/40"><Search size={17} /> Find professionals</Link>
          </div>
          <p className="mt-4 text-xs text-white/65">Sign in is required before project details can be saved or published.</p>
        </div>
      </div>

      <section className="border-b border-[#e3e6e4] py-14 sm:py-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-extrabold uppercase text-[#d65f45]">Work photos</p><h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">See what your project could become.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7873]">Open a completed-work direction, save it to your account, or carry it into a new project brief.</p></div>
          <Link href="/v2/projects/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#d65f45] px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#9f3d2b]">Get proposals <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-8 grid auto-rows-[270px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleWork.map((property, index) => <button type="button" onClick={() => setSelectedWork(property)} key={property.id ?? property.title} className={`group relative min-h-0 overflow-hidden rounded-md bg-[#17201d] text-left ${property.featured ? "lg:col-span-2 lg:row-span-2" : ""}`}>
            <img src={property.image} alt={`${property.title} in ${property.city}`} loading={index > 1 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,12,.04)_25%,rgba(8,14,12,.82)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold text-white/75"><MapPin size={13} />{property.city}<span className="h-1 w-1 rounded-full bg-white/45" />{property.type}</div>
              <h3 className={`mt-2 font-extrabold leading-tight ${property.featured ? "text-xl sm:text-2xl" : "text-base"}`}>{property.title}</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-white/90 opacity-100 transition group-hover:text-white lg:opacity-0 lg:group-hover:opacity-100">Open project details <ArrowRight size={14} /></span>
            </div>
          </button>)}
            </div>
      </section>

      <section className="py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase text-[#d65f45]">Project services</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Start with the work you actually need.</h2></div><Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#d64f31]">View all services <ArrowRight size={16} /></Link></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(({ title, description, icon: Icon, href }) => <Link key={title} href={href} className="group min-h-40 rounded-md border border-[#e2e5e3] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#efaa94] hover:shadow-sm"><Icon size={22} className="text-[#414b46] group-hover:text-[#d65f45]" /><h3 className="mt-6 text-base font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6f7873]">{description}</p></Link>)}</div>
      </section>

      <section className="border-t border-[#e3e6e4] py-14"><p className="text-xs font-extrabold uppercase text-[#d65f45]">Materials and specifications</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Compare a finish without leaving the page.</h2><div className="mt-7 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]"><div className="grid content-start gap-2">{materialPreviews.map((item) => <button type="button" key={item.name} onClick={() => setSelectedMaterial(selectedMaterial?.name === item.name ? null : item)} aria-expanded={selectedMaterial?.name === item.name} className={`rounded-md border p-4 text-left ${selectedMaterial?.name === item.name ? "border-[#d65f45] bg-white" : "border-[#e2e5e3] bg-white/70"}`}><span className="block text-sm font-extrabold">{item.name}</span><span className="mt-1 block text-xs leading-5 text-[#6f7873]">{item.detail}</span></button>)}</div>{selectedMaterial ? <article className="overflow-hidden rounded-md border border-[#e2e5e3] bg-white"><img src={selectedMaterial.image} alt={`${selectedMaterial.name} material preview`} className="aspect-[16/8] w-full object-cover" /><div className="p-4"><p className="text-sm font-extrabold">{selectedMaterial.name}</p><p className="mt-1 text-xs text-[#6f7873]">Representative preview. Final selections remain subject to samples and specifications.</p></div></article> : <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-[#d8dcda] text-sm text-[#6f7873]">Select a material to view its preview.</div>}</div></section>

      <section className="grid gap-5 border-y border-[#e3e6e4] py-12 md:grid-cols-2 xl:grid-cols-4">{trustItems.map(([Icon, title, text]) => <article key={title} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#eef3f0] text-[#52645b]"><Icon size={19} /></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#707a75]">{text}</p></div></article>)}</section>
    </section>

    <section className="border-t border-[#e7e8ea] bg-white py-14 sm:py-16"><div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8"><p className="text-xs font-extrabold uppercase text-[#d65f45]">One connected project journey</p><h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">The workspace begins with your data, not a sample project.</h2><div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{workflow.map(([Icon, title, text], index) => <article key={title} className="min-h-56 rounded-md border border-[#e3e6e4] bg-[#fafaf9] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-md bg-white text-[#d65f45] shadow-sm"><Icon size={20} /></span><span className="text-xs font-extrabold text-[#9aa19d]">0{index + 1}</span></div><h3 className="mt-8 text-lg font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6e7772]">{text}</p><div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#3f7059]"><Check size={14} /> Stored in your account</div></article>)}</div></div></section>
    {selectedWork ? <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-label={`${selectedWork.title} project details`}><article className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white shadow-2xl"><div className="relative"><img src={selectedWork.image} alt={selectedWork.title} className="aspect-[16/9] w-full object-cover" /><button type="button" onClick={() => setSelectedWork(null)} aria-label="Close project details" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-[#171b20] shadow"><X size={19} /></button></div><div className="p-5 sm:p-7"><p className="flex items-center gap-2 text-xs font-bold text-[#6f7873]"><MapPin size={14} />{selectedWork.city} · {selectedWork.type}</p><h2 className="mt-2 text-2xl font-extrabold">{selectedWork.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7873]">Use this completed-work direction as visual context. Saving stores it in your Sajivo account; starting a brief carries the direction into project creation.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void saveInspiration(selectedWork)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d7dbd8] px-5 text-sm font-extrabold"><Save size={16} />Save to gallery</button>{selectedWork.professionalId ? <Link href={`/pros/${selectedWork.professionalId}`} className="inline-flex h-11 items-center justify-center rounded-md border border-[#d7dbd8] px-5 text-sm font-extrabold">View professional</Link> : null}<Link href={`/v2/projects/new?inspiration=${encodeURIComponent(selectedWork.title)}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#d65f45] px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#9f3d2b]">Start a project <ArrowRight size={16} /></Link></div></div></article></div> : null}
  </main>;
}
