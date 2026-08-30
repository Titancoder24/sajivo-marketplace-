import { ArrowRight, CheckCircle2 } from "lucide-react";
import { lifecycleStages, platformModules, stakeholderGroups } from "@/lib/v2/architecture";
import { WorkspaceHeader } from "@/components/v2/V2Shell";

export default function ArchitecturePage() {
  return (
    <div>
      <WorkspaceHeader eyebrow="SAJIVO v1.0 architecture" title="One operating system for the built environment" description="A connected marketplace, business OS and SAIOS intelligence layer for every stakeholder from discovery through handover and growth." />
      <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-lg font-extrabold">Stakeholder network</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stakeholderGroups.map(({ name, roles, icon: Icon }) => (
              <article key={name} className="rounded-md border border-[#dfe3df] bg-white p-4 shadow-sm">
                <Icon size={19} className="text-[#d65f45]" />
                <h3 className="mt-4 text-sm font-bold">{name}</h3>
                <p className="mt-1 text-xs leading-5 text-[#6b746f]">{roles}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#d65f45]">Platform layer</p><h2 className="mt-2 text-xl font-extrabold">Core and supporting engines</h2></div>
            <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-[11px] font-bold text-[#397158]">12 connected modules</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {platformModules.map(({ name, description, icon: Icon }) => (
              <article key={name} className="flex gap-4 rounded-md border border-[#dfe3df] bg-white p-5 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#1d2a27] text-white"><Icon size={18} /></span>
                <div className="min-w-0"><h3 className="text-sm font-bold">{name}</h3><p className="mt-1 text-xs leading-5 text-[#6c7571]">{description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#d65f45]">End-to-end lifecycle</p>
          <h2 className="mt-2 text-xl font-extrabold">Nine stages, one accountable workspace</h2>
          <div className="mt-5 grid gap-2">
            {lifecycleStages.map(([number, name, description], index) => (
              <article key={number} className="grid gap-3 rounded-md border border-[#dfe3df] bg-white p-4 shadow-sm sm:grid-cols-[48px_220px_1fr_auto] sm:items-center">
                <span className="text-xs font-extrabold text-[#d65f45]">{number}</span>
                <h3 className="text-sm font-bold">{name}</h3>
                <p className="text-xs leading-5 text-[#6b746f]">{description}</p>
                {index === lifecycleStages.length - 1 ? <CheckCircle2 size={18} className="text-[#3f7b60]" /> : <ArrowRight size={17} className="hidden text-[#9ca49f] sm:block" />}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
