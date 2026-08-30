"use client";

import { Building2, Check, Eye, EyeOff, Hammer, Home, LoaderCircle, LockKeyhole, Mail, Paintbrush, ShieldCheck, ShoppingBag, UserRound, UsersRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { roleDashboardPath } from "@/lib/constants";
import type { AccountType, BusinessAccountType, PhaseOneBusinessRole, UserRole } from "@/types/domain";

function Field({ id, label, type = "text", value, onChange, name, autoComplete, required = true, icon: Icon }: { id: string; label: string; type?: string; value?: string; onChange?: (value: string) => void; name?: string; autoComplete?: string; required?: boolean; icon: typeof Mail }) {
  return <div><Label htmlFor={id}>{label}</Label><div className="relative"><Icon className="pointer-events-none absolute left-3 top-3.5 text-[var(--rv-ink-2)]" size={16} /><Input id={id} name={name} type={type} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} autoComplete={autoComplete} required={required} className="pl-9" /></div></div>;
}

function PasswordField({ id, label, value, onChange, name, autoComplete }: { id: string; label: string; value?: string; onChange?: (value: string) => void; name?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <div><Label htmlFor={id}>{label}</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3.5 text-[var(--rv-ink-2)]" size={16} /><Input id={id} name={name} type={visible ? "text" : "password"} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} autoComplete={autoComplete} required className="px-10" /><button type="button" onClick={() => setVisible((current) => !current)} className="rv-focus absolute right-2 top-1.5 grid h-8 w-8 place-items-center rounded-md text-[var(--rv-ink-2)] hover:bg-[var(--rv-bg)]" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const payload = await response.json();
      if (!response.ok) { toast.error(payload.error ?? "Unable to login"); return; }
      toast.success("Welcome back to Sajivo");
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
      router.push(safeNext ?? (roleDashboardPath[payload.role as UserRole] ?? "/dashboard"));
    } catch {
      toast.error("We could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="grid gap-4"><Field id="email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" icon={Mail} /><PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" /><div className="flex items-center justify-between gap-4"><label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--rv-ink-2)]"><input type="checkbox" className="h-4 w-4 accent-[var(--rv-terracotta)]" /> Keep me signed in</label><span className="flex items-center gap-1 text-xs text-[var(--rv-ink-2)]"><ShieldCheck size={13} /> Secure login</span></div><Button className="mt-1 w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={16} /> Signing in…</> : "Sign in"}</Button></form>;
}

const accountTypes: { value: AccountType; title: string; description: string; icon: typeof Home }[] = [
  { value: "client", title: "Client account", description: "Post requirements, compare proposals, and manage your project", icon: Home },
  { value: "business", title: "Business account", description: "Offer professional services or sell interior products", icon: Building2 },
];

const businessTypes: { value: BusinessAccountType; title: string; description: string; icon: typeof Home }[] = [
  { value: "professional", title: "Professional", description: "Provide design or project execution services", icon: UsersRound },
  { value: "vendor", title: "Vendor", description: "Supply products and materials to customers and projects", icon: ShoppingBag },
];

const professionalRoles: { value: PhaseOneBusinessRole; title: string; description: string; icon: typeof Home }[] = [
  { value: "interior_designer", title: "Interior designer", description: "Create concepts, plans, and design proposals", icon: Paintbrush },
  { value: "contractor", title: "Contractor", description: "Quote, coordinate, and execute interior work", icon: Hammer },
];

function SelectionCard({ active, title, description, icon: Icon, onClick }: { active: boolean; title: string; description: string; icon: typeof Home; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`rv-focus relative min-h-28 rounded-lg border p-4 text-left transition ${active ? "border-[var(--rv-terracotta)] bg-[rgba(198,93,71,0.06)] shadow-sm" : "border-[var(--rv-border)] bg-white hover:border-[var(--rv-ink-2)] hover:bg-[var(--rv-bg)]"}`}><Icon size={20} className={active ? "text-[var(--rv-terracotta)]" : "text-[var(--rv-ink-2)]"} /><span className="mt-3 block text-sm font-bold">{title}</span><span className="mt-1 block text-xs leading-5 text-[var(--rv-ink-2)]">{description}</span>{active && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[var(--rv-terracotta)] text-white"><Check size={12} /></span>}</button>;
}

export function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const initialRole = params.get("role");
  const [accountType, setAccountType] = useState<AccountType>(initialRole === "designer" || initialRole === "contractor" || initialRole === "vendor" ? "business" : "client");
  const [businessType, setBusinessType] = useState<BusinessAccountType>(initialRole === "vendor" ? "vendor" : "professional");
  const [businessRole, setBusinessRole] = useState<PhaseOneBusinessRole>(initialRole === "contractor" ? "contractor" : initialRole === "vendor" ? "retailer" : "interior_designer");
  const [loading, setLoading] = useState(false);

  const role: UserRole = accountType === "client" ? "customer" : businessType === "vendor" ? "vendor" : businessRole === "contractor" ? "contractor" : "designer";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), accountType, businessType: accountType === "business" ? businessType : null, businessRole: accountType === "business" ? businessRole : null, role }) });
      const payload = await response.json();
      if (!response.ok) { toast.error(payload.error ?? "Unable to create account"); return; }
      toast.success(payload.requiresEmailConfirmation ? "Account created. Check your email to confirm access." : "Account created");
      router.push(payload.requiresEmailConfirmation ? `/login?registered=1&role=${role}` : roleDashboardPath[role]);
    } catch {
      toast.error("We could not create the account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="grid gap-6">
    <fieldset><legend className="mb-2 text-sm font-semibold">Choose your account type</legend><div className="grid gap-3 sm:grid-cols-2">{accountTypes.map((item) => <SelectionCard key={item.value} {...item} active={accountType === item.value} onClick={() => setAccountType(item.value)} />)}</div></fieldset>
    {accountType === "business" && <fieldset><legend className="mb-2 text-sm font-semibold">How will your business use Sajivo?</legend><div className="grid gap-3 sm:grid-cols-2">{businessTypes.map((item) => <SelectionCard key={item.value} {...item} active={businessType === item.value} onClick={() => { setBusinessType(item.value); setBusinessRole(item.value === "vendor" ? "retailer" : "interior_designer"); }} />)}</div></fieldset>}
    {accountType === "business" && businessType === "professional" && <fieldset><legend className="mb-2 text-sm font-semibold">Select your phase-one professional role</legend><div className="grid gap-3 sm:grid-cols-2">{professionalRoles.map((item) => <SelectionCard key={item.value} {...item} active={businessRole === item.value} onClick={() => setBusinessRole(item.value)} />)}</div></fieldset>}
    {accountType === "business" && businessType === "vendor" && <fieldset><legend className="mb-2 text-sm font-semibold">Select your phase-one vendor role</legend><SelectionCard active title="Retailer" description="List interior products, receive enquiries, quote, and manage orders" icon={ShoppingBag} onClick={() => setBusinessRole("retailer")} /></fieldset>}
    <div className="grid gap-4 sm:grid-cols-2"><Field id="fullName" name="fullName" label="Full name" autoComplete="name" icon={UserRound} /><Field id="registerEmail" name="email" label="Email address" type="email" autoComplete="email" icon={Mail} /></div><PasswordField id="registerPassword" name="password" label="Create password" autoComplete="new-password" /><div className="grid grid-cols-2 gap-2 text-xs text-[var(--rv-ink-2)]"><span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> 8+ characters</span><span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> One number</span></div><label className="flex items-start gap-2 text-xs leading-5 text-[var(--rv-ink-2)]"><input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--rv-terracotta)]" />I agree to Sajivo’s terms and privacy policy.</label><Button className="w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={16} /> Creating account…</> : `Create ${accountType === "client" ? "client" : "business"} account`}</Button>
  </form>;
}

export function PasswordHelpForm({ mode }: { mode: "forgot" | "reset" }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (sent) return <div className="py-4 text-center" role="status"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Mail size={22} /></span><h2 className="font-display mt-4 text-xl">{mode === "forgot" ? "Check your email" : "Password updated"}</h2><p className="mt-2 text-sm leading-6 text-[var(--rv-ink-2)]">{mode === "forgot" ? "We sent password reset instructions to the address you provided." : "Your new password is ready. You can return to sign in."}</p></div>;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth/reset-password";
      const body = mode === "forgot" ? { email: form.get("email") } : { password: form.get("password") };
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to complete the request.");
      setSent(true);
      toast.success(mode === "forgot" ? "Password reset email sent." : "Password updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete the request.");
    } finally {
      setLoading(false);
    }
  }
  return <form className="grid gap-4" onSubmit={submit}>{mode === "forgot" && <Field id="helpEmail" name="email" label="Email address" type="email" autoComplete="email" icon={Mail} />}{mode === "reset" && <PasswordField id="newPassword" name="password" label="New password" autoComplete="new-password" />}{error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={16} /> Working…</> : mode === "forgot" ? "Send reset link" : "Update password"}</Button><p className="text-center text-xs leading-5 text-[var(--rv-ink-2)]">For your security, reset links expire after 30 minutes.</p></form>;
}
