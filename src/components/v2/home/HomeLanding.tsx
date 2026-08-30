import Link from "next/link";
import { ArrowRight, Blocks, BriefcaseBusiness, Building2, Check, ClipboardCheck, FileText, Hammer, Handshake, Layers3, MessageSquareText, PaintRoller, PanelTop, Search, ShieldCheck, Sparkles, WalletCards, type LucideIcon } from "lucide-react";

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

export function HomeLanding() {
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

      <section className="py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase text-[#d65f45]">Project services</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Start with the work you actually need.</h2></div><Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#d64f31]">View all services <ArrowRight size={16} /></Link></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(({ title, description, icon: Icon, href }) => <Link key={title} href={href} className="group min-h-40 rounded-md border border-[#e2e5e3] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#efaa94] hover:shadow-sm"><Icon size={22} className="text-[#414b46] group-hover:text-[#d65f45]" /><h3 className="mt-6 text-base font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6f7873]">{description}</p></Link>)}</div>
      </section>

      <section className="grid gap-5 border-y border-[#e3e6e4] py-12 md:grid-cols-2 xl:grid-cols-4">{trustItems.map(([Icon, title, text]) => <article key={title} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#eef3f0] text-[#52645b]"><Icon size={19} /></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#707a75]">{text}</p></div></article>)}</section>
    </section>

    <section className="border-t border-[#e7e8ea] bg-white py-14 sm:py-16"><div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8"><p className="text-xs font-extrabold uppercase text-[#d65f45]">One connected project journey</p><h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">The workspace begins with your data, not a sample project.</h2><div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{workflow.map(([Icon, title, text], index) => <article key={title} className="min-h-56 rounded-md border border-[#e3e6e4] bg-[#fafaf9] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-md bg-white text-[#d65f45] shadow-sm"><Icon size={20} /></span><span className="text-xs font-extrabold text-[#9aa19d]">0{index + 1}</span></div><h3 className="mt-8 text-lg font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6e7772]">{text}</p><div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#3f7059]"><Check size={14} /> Stored in your account</div></article>)}</div></div></section>
  </main>;
}
