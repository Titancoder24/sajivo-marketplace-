import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Camera, MapPin } from "lucide-react";
import { BrandMark } from "@/components/sajivo/BrandMark";

const groups = [
  ["Explore", [["Services", "/services"], ["Find professionals", "/professionals"], ["Vendors / Businesses", "/for-professionals"], ["How Sajivo Works", "/how-it-works"]]],
  ["Professionals", [["Join Sajivo", "/for-professionals"], ["Designer account", "/v2/register?role=designer"], ["Contractor account", "/v2/register?role=contractor"]]],
  ["Account", [["Log in", "/login"], ["Create account", "/v2/register"], ["Start a project", "/v2/register?role=customer"]]],
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--rv-border)] bg-white pb-16 md:pb-0">
      <div className="page-shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--rv-ink-2)]">A clearer way to discover trusted interior professionals and manage every decision from brief to handover.</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><MapPin size={16} /> Built for projects globally</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map(([title, items]) => (
              <div key={title}>
                <h3 className="text-sm font-bold">{title}</h3>
                <div className="mt-4 grid gap-3">
                  {items.map(([label, href]) => <Link key={href} href={href} className="text-sm text-[var(--rv-ink-2)] transition hover:text-[var(--rv-terracotta)]">{label}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--rv-border)] pt-6 text-xs text-[var(--rv-ink-2)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Sajivo. Interior projects, made clearer.</p>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="hover:text-[var(--rv-ink)]">Privacy</Link>
            <Link href="/how-it-works" className="hover:text-[var(--rv-ink)]">Terms</Link>
            <Link href="/services" aria-label="Photo inspiration gallery" className="hover:text-[var(--rv-ink)]"><Camera size={17} /></Link>
            <Link href="/for-professionals" aria-label="Professional network" className="hover:text-[var(--rv-ink)]"><BriefcaseBusiness size={17} /></Link>
            <Link href="/for-professionals" className="flex items-center gap-1 font-semibold text-[var(--rv-ink)]">Join as a pro <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
