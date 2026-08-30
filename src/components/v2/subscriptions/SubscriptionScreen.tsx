"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck, Bell, Bot, Building2, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleHelp, CreditCard, FileText, Gauge, Headphones, History, LayoutDashboard,
  Menu, Package, Plus, ReceiptText, Settings, ShieldCheck, Sparkles, Users, WalletCards,
  X, Zap,
} from "lucide-react";
import { BrandMark } from "@/components/sajivo/BrandMark";
import { currentPlanName, currentPlanPrice, plansByRole, roleMeta, usageByRole } from "./subscription-data";
import type { Plan, SubscriptionRole, SubscriptionSection, UsageItem } from "./subscription-data";

const sections: { key: SubscriptionSection; label: string; Icon: typeof Gauge }[] = [
  { key: "plans", label: "Plans", Icon: BadgeCheck },
  { key: "credits", label: "Credits", Icon: WalletCards },
  { key: "usage", label: "Usage & limits", Icon: Gauge },
  { key: "billing", label: "Billing", Icon: ReceiptText },
];

function routeFor(section: SubscriptionSection, role: SubscriptionRole) {
  return `/v2/subscriptions${section === "plans" ? "" : `/${section}`}?role=${role}`;
}

export function SubscriptionScreen({ initialRole, section }: { initialRole: SubscriptionRole; section: SubscriptionSection }) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [mobileNav, setMobileNav] = useState(false);
  const meta = roleMeta[role];
  const changeRole = (next: SubscriptionRole) => { setRole(next); router.replace(routeFor(section, next)); };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[#e8e8e5] bg-white transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-[#efefec] px-6"><BrandMark /><button onClick={() => setMobileNav(false)} aria-label="Close navigation" className="grid h-9 w-9 place-items-center lg:hidden"><X size={20} /></button></div>
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <NavItem Icon={LayoutDashboard} label="Dashboard" />
          <NavItem Icon={Package} label={role === "customer" ? "Projects" : role === "vendor" ? "Catalogue" : "Opportunities"} badge={role === "customer" ? undefined : "12"} />
          <NavItem Icon={FileText} label={role === "vendor" ? "Enquiries" : "Proposals"} />
          <NavItem Icon={Users} label={role === "customer" ? "Professionals" : "Clients"} />
          <NavItem Icon={Bot} label="Messages" badge="5" />
          <div className="my-4 border-t border-[#efefec]" />
          <p className="px-3 pb-2 text-[10px] font-bold uppercase text-[#94979d]">Manage business</p>
          <NavItem Icon={Building2} label="Business profile" />
          <NavItem Icon={Sparkles} label={role === "vendor" ? "Promotions" : "Portfolio"} />
          <NavItem Icon={Gauge} label="Analytics" />
          <NavItem Icon={BadgeCheck} label="Trust & verification" />
          <div className="my-4 border-t border-[#efefec]" />
          <NavItem Icon={Settings} label="Settings" />
          <Link href={routeFor("plans", role)} className="flex h-11 items-center gap-3 rounded-md bg-[#fff0eb] px-3 text-sm font-bold text-[#e74e1b]"><WalletCards size={18} />Subscription</Link>
          <NavItem Icon={CircleHelp} label="Help & support" />
        </nav>
        <div className="m-4 border border-[#eadff7] bg-[#fbf8ff] p-4">
          <p className="font-bold text-[#3e286d]">Upgrade & grow faster</p><p className="mt-2 text-xs leading-5 text-[#6b6574]">Unlock more opportunities and build your business with stronger limits.</p>
          <button onClick={() => toast.success("Upgrade options opened")} className="mt-4 flex h-10 w-full items-center justify-center gap-2 border border-[#ded4ec] bg-white text-xs font-bold text-[#5c3b96]">Upgrade now <ChevronRight size={14} /></button>
        </div>
      </aside>

      {mobileNav && <button aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      <div className="lg:pl-[248px]">
        <header className="flex min-h-[76px] items-center border-b border-[#ecece9] bg-white px-4 md:px-7 lg:px-8">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="mr-3 grid h-10 w-10 place-items-center lg:hidden"><Menu size={21} /></button>
          <div className="min-w-0"><h1 className="text-xl font-extrabold sm:text-2xl">Subscription</h1><p className="mt-0.5 hidden text-xs text-[#676b73] sm:block">Manage your plan, usage, credits and billing.</p></div>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <Link href="/v2/support" className="hidden items-center gap-2 border-r border-[#e6e6e3] pr-5 text-left md:flex"><Headphones size={20} /><span className="text-xs"><b className="block">Need help?</b><span className="font-semibold text-[#ed4e1b]">Chat with Angel</span></span></Link>
            <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center"><Bell size={20} /><span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">3</span></button>
            <div className="hidden text-right sm:block"><p className="max-w-36 truncate text-sm font-bold">{meta.account}</p><p className="text-xs text-[#6f737a]">{meta.subtitle}</p></div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#111827] text-xs font-bold text-white">{meta.initials}</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1510px] px-4 py-5 md:px-7 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex max-w-full overflow-x-auto border border-[#dededb] bg-white p-1" aria-label="Preview role">
              {(Object.keys(roleMeta) as SubscriptionRole[]).map((item) => <button key={item} onClick={() => changeRole(item)} className={`h-8 whitespace-nowrap px-3 text-xs font-bold ${role === item ? "bg-[#111827] text-white" : "text-[#666b73] hover:bg-[#f5f5f3]"}`}>{roleMeta[item].label}</button>)}
            </div>
            <p className="text-xs text-[#747880]">Viewing entitlements for <b className="text-[#252a31]">{meta.label}</b></p>
          </div>

          <PlanSummary role={role} />

          <div className="mt-5 border-b border-[#e8e8e5]">
            <nav className="flex max-w-full gap-1 overflow-x-auto" aria-label="Subscription sections">
              {sections.map(({ key, label, Icon }) => <Link key={key} href={routeFor(key, role)} className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${section === key ? "border-[#ed541b] text-[#e84d18]" : "border-transparent text-[#626771] hover:text-[#272b32]"}`}><Icon size={16} />{label}</Link>)}
            </nav>
          </div>

          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">{section === "plans" && <PlansView role={role} />}{section === "credits" && <CreditsView role={role} />}{section === "usage" && <UsageView role={role} />}{section === "billing" && <BillingView role={role} />}</div>
            <RightRail role={role} section={section} />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ Icon, label, badge }: { Icon: typeof Gauge; label: string; badge?: string }) { return <button className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-[#343840] hover:bg-[#f6f6f4]"><Icon size={18} /><span className="min-w-0 flex-1 truncate">{label}</span>{badge && <span className="grid h-5 min-w-5 place-items-center rounded bg-red-500 px-1 text-[10px] font-bold text-white">{badge}</span>}</button>; }

function PlanSummary({ role }: { role: SubscriptionRole }) {
  return <section className="grid overflow-hidden border border-[#bed9cf] bg-[#f4fbf8] lg:grid-cols-[minmax(0,1fr)_410px]">
    <div className="flex min-w-0 items-center gap-4 p-5 md:gap-6 md:p-7"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-[28%] bg-[#087b56] text-[#ffd24c] shadow-sm"><Sparkles size={34} fill="currentColor" /></span><div className="min-w-0"><p className="text-xs font-bold text-[#19725a]">Current plan</p><div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-2xl font-extrabold md:text-3xl">{currentPlanName[role]} Plan</h2><span className="rounded-full border border-[#cce7dc] bg-[#e8f7f0] px-3 py-1 text-xs font-bold text-[#19725a]">Active</span></div><p className="mt-2 text-sm text-[#606870]">Your plan is active and valid until 12 Sep 2026</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#565d65]"><span className="flex items-center gap-2"><History size={15} />Auto-renewal: ON</span><span className="flex items-center gap-2"><CalendarDays size={15} />Billed monthly</span></div></div></div>
    <div className="grid grid-cols-2 items-center gap-4 border-t border-[#d4e5df] p-5 lg:border-l lg:border-t-0 md:p-7"><div><p className="text-xs text-[#6d747b]">Next renewal</p><p className="mt-2 flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} className="text-[#13805d]" />12 Sep 2026</p><p className="mt-5 text-xs text-[#6d747b]">Amount</p><p className="mt-1 text-xl font-extrabold">{currentPlanPrice[role]} <span className="text-xs font-medium text-[#686e75]">/ month</span></p></div><button onClick={() => toast.success("Plan management opened")} className="flex h-11 items-center justify-center gap-2 border border-[#d4d7d4] bg-white px-3 text-sm font-bold shadow-sm">Manage plan <ChevronRight size={16} /></button></div>
  </section>;
}

function PlansView({ role }: { role: SubscriptionRole }) { return <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plansByRole[role].map((plan) => <PlanCard key={plan.name} plan={plan} />)}</div><IncludedStrip /></>; }

function PlanCard({ plan }: { plan: Plan }) { return <article className={`relative flex min-w-0 flex-col border bg-white p-5 ${plan.current ? "border-[#ef744c] shadow-[0_0_0_1px_#ef744c]" : "border-[#e5e5e2]"}`}>
  {plan.popular && <span className="absolute right-3 top-3 bg-[#f15317] px-2.5 py-1 text-[10px] font-bold text-white">Most popular</span>}<h3 className="pr-20 text-xl font-extrabold">{plan.name}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-[#6a6f77]">{plan.description}</p><p className="mt-4 text-2xl font-extrabold">{plan.price}{plan.price !== "Custom" && <span className="text-xs font-medium text-[#686d74]"> / month</span>}</p><p className="mt-1 text-xs text-[#71767d]">{plan.cadence}</p>
  <button onClick={() => toast(plan.current ? `${plan.name} is your current plan` : `${plan.name} selected`)} className={`mt-5 h-11 w-full border px-3 text-sm font-bold ${plan.current ? "border-[#f15317] bg-[#f15317] text-white" : "border-[#d8d9d6] bg-white hover:bg-[#f8f8f6]"}`}>{plan.current ? "Current plan" : plan.price === "Custom" ? "Contact sales" : "Choose plan"}</button>
  <ul className="mt-5 flex-1 space-y-3">{plan.entitlements.map((item) => <li key={item.label} className={`flex gap-2 text-xs leading-5 ${item.included ? "text-[#40464d]" : "text-[#9a9da2]"}`}>{item.included ? <Check size={15} className="mt-0.5 shrink-0 rounded-full border border-[#3b9a7b] p-0.5 text-[#16805f]" /> : <X size={15} className="mt-0.5 shrink-0 rounded-full border border-[#c8c9c7] p-0.5" />}<span>{item.label}</span></li>)}</ul><button className="mt-6 text-xs font-bold text-[#6540a5]">View details</button>
  </article>; }

function IncludedStrip() { const items = [[ShieldCheck,"Secure platform","256-bit encryption"],[Zap,"AI matching","Better project matches"],[CreditCard,"Mobile access","Android, iOS & PWA"],[Users,"Community","Learn and grow together"]] as const; return <section className="mt-5 border border-[#e7e7e4] bg-white p-5"><h3 className="text-sm font-extrabold">All plans include</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(([Icon,title,text]) => <div key={title} className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center bg-[#f5f8f4] text-[#16805f]"><Icon size={18} /></span><div><p className="text-xs font-bold">{title}</p><p className="mt-0.5 text-[10px] text-[#747980]">{text}</p></div></div>)}</div></section>; }

function CreditsView({ role }: { role: SubscriptionRole }) { const usage = usageByRole[role]; return <div className="space-y-5"><SectionHeading title="Credit wallet" text="Included credits reset with your billing cycle. Purchased top-ups never expire." /><div className="grid gap-4 md:grid-cols-2">{usage.slice(0,2).map((item) => <CreditCardPanel key={item.label} item={item} />)}</div><section className="border border-[#e5e5e2] bg-white"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecece9] p-5"><div><h3 className="font-extrabold">Available top-ups</h3><p className="mt-1 text-xs text-[#70757d]">Add credits without changing your plan.</p></div></header><AddOnRow Icon={Zap} title={role === "vendor" ? "Enquiry credit pack" : role === "customer" ? "AI design pack" : "Proposal credit pack"} note="10 extra credits" price="₹249" /><AddOnRow Icon={Sparkles} title="AI credits pack" note="500 AI credits" price="₹199" /><AddOnRow Icon={BadgeCheck} title="Featured boost" note="7 days featured placement" price="₹499" /></section></div>; }

function CreditCardPanel({ item }: { item: UsageItem }) { const remaining = item.limit - item.used; return <article className="border border-[#e5e5e2] bg-white p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center" style={{ color: item.color, background: item.soft }}><item.Icon size={21} /></span><span className="bg-[#eef8f3] px-2 py-1 text-[10px] font-bold text-[#16785b]">Included</span></div><h3 className="mt-5 font-extrabold">{item.label}</h3><p className="mt-2 text-3xl font-extrabold">{Number.isInteger(remaining) ? remaining : remaining.toFixed(1)} <span className="text-sm font-medium text-[#747980]">remaining</span></p><div className="mt-4 h-2 bg-[#ededeb]"><div className="h-full" style={{ width: `${Math.min(100, item.used/item.limit*100)}%`, background: item.color }} /></div><p className="mt-3 text-xs text-[#747980]">{item.detail}</p></article>; }

function UsageView({ role }: { role: SubscriptionRole }) { return <div className="space-y-5"><SectionHeading title="Usage & limits" text="Track every included entitlement in the current billing cycle." /><section className="border border-[#e5e5e2] bg-white p-5 md:p-6"><div className="grid gap-6 md:grid-cols-2">{usageByRole[role].map((item) => <UsageBlock key={item.label} item={item} detailed />)}</div></section><section className="border border-[#e5e5e2] bg-white"><div className="border-b border-[#ecece9] p-5"><h3 className="font-extrabold">Entitlement status</h3></div>{plansByRole[role].find((plan) => plan.current)?.entitlements.map((item) => <div key={item.label} className="flex items-center gap-3 border-b border-[#f0f0ed] px-5 py-4 last:border-b-0"><span className={`grid h-7 w-7 place-items-center rounded-full ${item.included ? "bg-[#e9f7f1] text-[#14805e]" : "bg-[#f1f1ef] text-[#92969b]"}`}>{item.included ? <Check size={15} /> : <X size={15} />}</span><p className="min-w-0 flex-1 text-sm font-semibold">{item.label}</p><span className={`text-xs font-bold ${item.included ? "text-[#16805f]" : "text-[#8d9196]"}`}>{item.included ? "Available" : "Not included"}</span></div>)}</section></div>; }

function BillingView({ role }: { role: SubscriptionRole }) { return <div className="space-y-5"><SectionHeading title="Billing & invoices" text="Manage payment details and download your subscription records." /><section className="border border-[#e5e5e2] bg-white"><div className="grid gap-6 p-5 md:grid-cols-2 md:p-6"><div><p className="text-xs text-[#747980]">Payment method</p><div className="mt-3 flex items-center gap-3"><span className="font-black italic text-[#17247b]">VISA</span><p className="text-sm font-bold">•••• 4242</p><span className="text-xs text-[#747980]">Expires 08/27</span></div></div><div className="md:text-right"><button onClick={() => toast.success("Payment method editor opened")} className="h-10 border border-[#d9dad7] bg-white px-4 text-xs font-bold">Update payment method</button></div></div><div className="border-t border-[#ecece9] p-5 md:p-6"><p className="text-xs text-[#747980]">Billing address</p><p className="mt-2 text-sm font-bold">{roleMeta[role].account}</p><p className="mt-1 text-xs text-[#656a72]">Bandra West, Mumbai - 400050</p></div></section><section className="border border-[#e5e5e2] bg-white"><header className="border-b border-[#ecece9] p-5"><h3 className="font-extrabold">Billing history</h3></header><InvoiceRow plan={currentPlanName[role]} date="12 Aug 2026" amount={currentPlanPrice[role]} status="Paid" /><InvoiceRow plan={currentPlanName[role]} date="12 Jul 2026" amount={currentPlanPrice[role]} status="Paid" /><InvoiceRow plan={currentPlanName[role]} date="12 Jun 2026" amount={currentPlanPrice[role]} status="Paid" /></section><div className="flex flex-wrap items-center justify-between gap-3 border border-[#f1dfc6] bg-[#fffaf1] p-5"><div className="flex gap-3"><ShieldCheck size={20} className="text-[#c48a26]" /><div><p className="text-sm font-bold">Secure & safe billing</p><p className="mt-1 text-xs text-[#77736d]">Cancel anytime. No hidden charges.</p></div></div><button onClick={() => toast.error("Cancellation requires confirmation")} className="text-xs font-bold text-[#d54f36]">Cancel subscription</button></div></div>; }

function InvoiceRow({ plan, date, amount, status }: { plan: string; date: string; amount: string; status: string }) { return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[#f0f0ed] px-5 py-4 last:border-b-0"><div><p className="text-sm font-bold">{plan} plan</p><p className="mt-1 text-xs text-[#767a81]">{date}</p></div><span className="rounded-full bg-[#e9f7f1] px-2.5 py-1 text-[10px] font-bold text-[#14795b]">{status}</span><button onClick={() => toast.success("Invoice download started")} className="text-sm font-bold">{amount} <span className="ml-2 text-[#5f40a0]">↓</span></button></div>; }

function RightRail({ role, section }: { role: SubscriptionRole; section: SubscriptionSection }) { return <aside className="space-y-5"><section className="border border-[#e5e5e2] bg-white p-5"><div className="flex items-baseline justify-between gap-3"><h2 className="font-extrabold">Your usage <span className="font-medium text-[#6e737a]">(this cycle)</span></h2><span className="text-[10px] text-[#767b82]">Resets in 8 days</span></div><div className="mt-5 space-y-6">{usageByRole[role].map((item) => <UsageBlock key={item.label} item={item} />)}</div>{section !== "usage" && <Link href={routeFor("usage", role)} className="mt-5 flex items-center justify-center gap-2 border-t border-[#efefec] pt-4 text-xs font-bold text-[#2875bd]">View all usage & limits <ChevronRight size={14} /></Link>}</section>{section !== "credits" && <section className="border border-[#e5e5e2] bg-white"><div className="p-5"><h2 className="font-extrabold">Available add-ons</h2></div><AddOnRow Icon={Zap} title="Extra credits" note="+10 credits" price="₹249" /><AddOnRow Icon={Sparkles} title="AI credits pack" note="+500 AI credits" price="₹199" /><AddOnRow Icon={BadgeCheck} title="Featured listing" note="7 days featured" price="₹499" /></section>}<BillingSummary role={role} /></aside>; }

function UsageBlock({ item, detailed = false }: { item: UsageItem; detailed?: boolean }) { const pct = Math.round(item.used / item.limit * 100); return <div className={detailed ? "border border-[#ecece9] p-4" : ""}><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center" style={{ color: item.color, background: item.soft }}><item.Icon size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.label}</p><p className="mt-1 text-[11px] text-[#697078]">{item.detail}</p></div><b className="text-xs">{pct}%</b></div><div className="mt-3 h-1.5 bg-[#ececea]"><div className="h-full" style={{ width: `${Math.min(100,pct)}%`, background: item.color }} /></div></div>; }

function AddOnRow({ Icon, title, note, price }: { Icon: typeof Zap; title: string; note: string; price: string }) { return <div className="flex items-center gap-3 border-t border-[#efefec] px-5 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center bg-[#f0f8f4] text-[#16805f]"><Icon size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{title}</p><p className="mt-0.5 truncate text-[10px] text-[#737880]">{note}</p></div><b className="text-xs">{price}</b><button onClick={() => toast.success(`${title} added`)} aria-label={`Add ${title}`} className="grid h-9 w-9 shrink-0 place-items-center border border-[#dedfdd] hover:bg-[#f7f7f5]"><Plus size={17} /></button></div>; }

function BillingSummary({ role }: { role: SubscriptionRole }) { return <section className="border border-[#e5e5e2] bg-white p-5"><h2 className="font-extrabold">Billing summary</h2><dl className="mt-4 space-y-3 text-xs"><SummaryRow label="Plan" value={`${currentPlanName[role]} Plan`} /><SummaryRow label="Billing cycle" value="Monthly" /><SummaryRow label="Next billing date" value="12 Sep 2026" /><SummaryRow label="Amount" value={currentPlanPrice[role]} /></dl><div className="mt-5 flex items-center gap-3 border-t border-[#efefec] pt-4"><b className="italic text-[#17247b]">VISA</b><span className="text-xs">•••• 4242</span><Link href={routeFor("billing", role)} className="ml-auto text-xs font-bold text-[#2875bd]">Manage</Link></div></section>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-[#777b82]">{label}</dt><dd className="text-right font-bold">{value}</dd></div>; }
function SectionHeading({ title, text }: { title: string; text: string }) { return <header><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-1 text-sm leading-6 text-[#6c7178]">{text}</p></header>; }
