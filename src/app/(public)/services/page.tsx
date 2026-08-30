import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ServiceCategoryCard } from "@/components/sajivo/ServiceCategoryCard";
import { getServices } from "@/lib/server/repository";

export default async function ServicesPage() {
  const list = await getServices();
  return (
    <>
      <section className="bg-white py-12 sm:py-16"><div className="page-shell grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-sm font-bold text-[var(--rv-terracotta)]">Services</p><h1 className="font-display mt-2 max-w-3xl text-4xl leading-tight sm:text-5xl">Every detail, from first sketch to final finish.</h1><p className="mt-4 max-w-2xl leading-7 text-[var(--rv-ink-2)]">Choose the work your project needs and find professionals with the right experience, portfolio, and availability.</p></div><form action="/professionals" className="flex rounded-full border border-[var(--rv-border)] bg-white p-1.5 shadow-lg shadow-black/5"><label className="flex min-w-0 flex-1 items-center gap-3 px-4"><Search size={18} /><input name="q" placeholder="Search services" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><button className="button-3d button-depth-secondary rounded-full bg-[var(--rv-slate)] px-5 py-3 text-sm font-bold text-white">Find a pro</button></form></div></section>
      <section className="page-shell py-10 sm:py-14"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((service) => <ServiceCategoryCard key={service.id} service={service} />)}</div></section>
      <section className="border-y border-[var(--rv-border)] bg-white"><div className="page-shell grid gap-8 py-14 lg:grid-cols-[1fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold text-[var(--rv-terracotta)]">Not sure where to begin?</p><h2 className="font-display mt-2 text-3xl">Start with the space, not the terminology.</h2><p className="mt-4 leading-7 text-[var(--rv-ink-2)]">Tell Sajivo what you want to change. The brief helps turn your goals into a scope professionals can price and plan clearly.</p><ButtonLink href="/v2/register?role=customer" className="mt-6">Create your brief <ArrowRight size={17} /></ButtonLink></div><div className="grid gap-3 sm:grid-cols-3">{["Choose rooms and scope", "Select services and budget", "Add photos and references"].map((item, index) => <div key={item} className="rounded-lg bg-[var(--rv-bg)] p-5"><CheckCircle2 className="text-[var(--rv-moss)]" size={21} /><p className="mt-8 text-xs font-bold text-[var(--rv-terracotta)]">STEP 0{index + 1}</p><p className="mt-2 font-bold">{item}</p></div>)}</div></div></section>
    </>
  );
}
