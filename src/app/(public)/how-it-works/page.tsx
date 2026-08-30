import { ArrowRight, Check, ClipboardList, Files, MessagesSquare, SearchCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const steps = [
  [ClipboardList, "Create your brief", "Select scope, services, budget, location, timeline, and upload references.", ["Room-by-room scope", "Budget and timing", "Reference files"]],
  [SearchCheck, "Review proposals", "Designers and contractors send scoped pricing, timelines, messages, and deliverables.", ["Comparable offers", "Verified profiles", "Clear deliverables"]],
  [MessagesSquare, "Accept and collaborate", "Shortlist, accept, open the workspace, exchange files, track activity, and complete the project.", ["Shared messages", "Files and activity", "Completion review"]],
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-white py-14 sm:py-20"><div className="page-shell text-center"><p className="text-sm font-bold text-[var(--rv-terracotta)]">How Sajivo works</p><h1 className="font-display mx-auto mt-3 max-w-4xl text-4xl leading-tight sm:text-6xl">From a rough idea to a professionally managed project.</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--rv-ink-2)]">One clear workflow for homeowners, designers, and contractors, with the important decisions documented along the way.</p><ButtonLink href="/v2/register?role=customer" size="lg" className="mt-8 rounded-full">Start your project <ArrowRight size={18} /></ButtonLink></div></section>
      <section className="page-shell py-12 sm:py-16"><div className="grid gap-5 lg:grid-cols-3">{steps.map(([Icon, title, text, points], index) => <article key={title} className="relative overflow-hidden rounded-lg border border-[var(--rv-border)] bg-white p-6 sm:p-7"><span className="absolute right-5 top-4 font-display text-6xl text-[var(--rv-bg)]">0{index + 1}</span><Icon size={25} className="relative text-[var(--rv-terracotta)]" /><h2 className="font-display relative mt-10 text-2xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--rv-ink-2)]">{text}</p><div className="mt-6 grid gap-2 border-t border-[var(--rv-border)] pt-5">{points.map((point) => <p key={point} className="flex items-center gap-2 text-sm font-semibold"><Check size={15} className="text-[var(--rv-moss)]" /> {point}</p>)}</div></article>)}</div></section>
      <section className="bg-[var(--rv-slate)] py-14 text-white sm:py-20"><div className="page-shell grid gap-10 lg:grid-cols-2 lg:items-center"><div><Files size={28} className="text-[#e9a798]" /><h2 className="font-display mt-5 text-3xl sm:text-4xl">Everything stays connected to the project.</h2><p className="mt-4 max-w-xl leading-7 text-white/70">Proposals, decisions, messages, files, and status changes live in one workspace so the team always has the same context.</p></div><div className="grid grid-cols-2 gap-3">{[["Brief", "A precise source of truth"], ["Proposals", "Scope you can compare"], ["Workspace", "Shared project context"], ["Review", "A documented handover"]].map(([title, text]) => <div key={title} className="rounded-lg border border-white/15 bg-white/5 p-5"><p className="font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-white/60">{text}</p></div>)}</div></div></section>
    </>
  );
}
