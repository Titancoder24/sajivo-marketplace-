import { getActiveUser } from "@/lib/supabase/account-access";
import { CreditCard, Info, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/sajivo/DashboardBlocks";
import { createClient } from "@/lib/supabase/server";

export default async function CreditsPage() {
  const supabase = await createClient();
  const { data: auth } = supabase ? await getActiveUser(supabase) : { data: { user: null } };
  const { data: wallets } = supabase && auth.user
    ? await supabase.from("credit_wallets").select("credit_type, plan_name, included_remaining, included_limit, top_up_remaining, reset_at").eq("account_id", auth.user.id)
    : { data: null };
  const rows = wallets ?? [];

  return <>
    <DashboardHeader eyebrow="Usage entitlements" title="Credits" text="Separate usage credits keep requirement generation and proposal submissions transparent." />
    {rows.length ? <div className="grid gap-4 md:grid-cols-2">{rows.map((wallet) => <section key={wallet.credit_type} className="rounded-lg border border-[var(--rv-border)] bg-[var(--rv-surface)] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--rv-terracotta-soft)] text-[var(--rv-terracotta)]"><CreditCard size={19} /></span><span className="rounded-full bg-[var(--rv-surface-muted)] px-3 py-1 text-xs font-bold capitalize">{wallet.plan_name}</span></div><h2 className="mt-5 font-display text-xl capitalize">{wallet.credit_type} credits</h2><p className="mt-2 text-3xl font-bold">{wallet.included_remaining}<span className="text-sm font-normal text-[var(--rv-ink-2)]"> / {wallet.included_limit} included</span></p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--rv-border)]"><div className="h-full rounded-full bg-[var(--rv-terracotta)]" style={{ width: `${wallet.included_limit ? Math.round((wallet.included_remaining / wallet.included_limit) * 100) : 0}%` }} /></div><p className="mt-3 text-xs text-[var(--rv-ink-2)]">Top-up balance: {wallet.top_up_remaining}</p></section>)}</div> : <section className="rounded-lg border border-dashed border-[var(--rv-border)] bg-white p-8 text-center"><h2 className="font-display text-xl">No credit wallet yet</h2><p className="mt-2 text-sm text-[var(--rv-ink-2)]">A wallet will appear after a plan or entitlement is assigned to this account.</p></section>}
    <section className="mt-5 flex gap-3 rounded-lg border border-[var(--rv-border)] bg-[var(--rv-surface-muted)] p-5 text-sm leading-6"><Info className="mt-0.5 shrink-0 text-[var(--rv-terracotta)]" size={18} /><p>Credits are consumed only after a successful action. Failed technical transactions do not consume credits, and the original transaction remains in the audit history.</p></section>
    <div className="mt-5 flex items-center gap-3 text-sm text-[var(--rv-ink-2)]"><Sparkles size={16} className="text-[var(--rv-gold)]" />Top-ups and plan limits are managed by the subscription billing engine.</div>
  </>;
}
