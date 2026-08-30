"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  Home,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SajivoLogo } from "@/components/brand/SajivoLogo";

const navigation = [
  { href: "/v2", label: "Explore", icon: Home },
  { href: "/v2/client", label: "Client OS", icon: CircleUserRound },
  { href: "/v2/professional", label: "Business OS", icon: BriefcaseBusiness },
  { href: "/v2/projects", label: "Projects", icon: Building2 },
  { href: "/v2/subscriptions", label: "Plans", icon: WalletCards },
  { href: "/v2/support", label: "Angel", icon: Bot },
] as const;

export function V2Shell({ children, initialProfile, isPlatformAdmin = false }: { children: React.ReactNode; initialProfile: { full_name?: string; primary_role?: string } | null; isPlatformAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const profile = initialProfile;
  const visibleNavigation = profile ? navigation : navigation.filter(({ href }) => href === "/v2" || href === "/v2/support");
  const workspaceHref = isPlatformAdmin ? "/v2/admin" : profile?.primary_role === "customer" ? "/v2/client" : profile?.primary_role === "vendor" ? "/vendor/dashboard" : profile?.primary_role === "admin" ? "/v2/admin" : "/v2/professional";
  const roleLabel = isPlatformAdmin ? "Super admin" : profile?.primary_role === "customer" ? "Client account" : profile?.primary_role === "vendor" ? "Vendor account" : profile?.primary_role === "admin" ? "Super admin" : "Professional account";
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccountOpen(false);
    router.replace("/login");
    router.refresh();
  }

  if (pathname.startsWith("/v2/admin")) {
    return <div className="min-h-screen bg-[#f6f7f5] text-[#1c2421]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-[#1c2421]">
      <header className="sticky top-0 z-50 border-b border-[#dfe3df] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1480px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <SajivoLogo compact />
          <nav className="ml-4 hidden min-w-0 flex-1 items-center gap-1 xl:flex" aria-label="Sajivo v2">
            {visibleNavigation.map(({ href, label }) => {
              const active = href === "/v2" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${active ? "bg-[#edf1ee] text-[#17201d]" : "text-[#626b67] hover:bg-[#f4f5f3] hover:text-[#17201d]"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/v2/architecture" className="hidden h-9 items-center gap-2 rounded-md border border-[#dfe3df] bg-white px-3 text-xs font-bold text-[#4d5753] shadow-sm md:flex">
              <Sparkles size={14} /> SAIOS
            </Link>
            {profile ? <>
              <button type="button" aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-md border border-[#dfe3df] bg-white text-[#505a56] shadow-sm"><Bell size={16} /></button>
              <Link href={workspaceHref} className="hidden h-9 items-center rounded-md bg-[#d65f45] px-4 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b] sm:flex">Open workspace</Link>
              <div className="relative hidden sm:block">
                <button type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} aria-label="Open account menu" className="flex h-9 max-w-[190px] items-center gap-2 rounded-md border border-[#dfe3df] bg-white px-3 text-left shadow-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7ede9] text-[10px] font-extrabold text-[#385044]">{profile.full_name?.trim().charAt(0).toUpperCase() || "S"}</span>
                  <span className="min-w-0"><span className="block truncate text-[11px] font-bold text-[#26312c]">{profile.full_name || "Sajivo member"}</span><span className="block truncate text-[9px] text-[#76817b]">{roleLabel}</span></span><ChevronDown size={13} className="shrink-0 text-[#707a75]" />
                </button>
                {accountOpen ? <div className="absolute right-0 top-11 z-50 w-56 rounded-md border border-[#dfe3df] bg-white p-2 shadow-xl"><div className="border-b border-[#edf0ee] px-2 pb-2 pt-1"><p className="truncate text-xs font-extrabold">{profile.full_name || "Sajivo member"}</p><p className="mt-0.5 text-[10px] text-[#748079]">Signed in · {roleLabel}</p></div><Link href={workspaceHref} onClick={() => setAccountOpen(false)} className="mt-1 flex h-9 items-center rounded-md px-2 text-xs font-bold hover:bg-[#f2f5f3]">Open workspace</Link><button type="button" onClick={logout} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-bold text-[#a23d2a] hover:bg-[#fff3ef]"><LogOut size={14} />Log out</button></div> : null}
              </div>
            </> : <>
              <Link href="/login" className="hidden h-9 items-center rounded-md border border-[#dfe3df] bg-white px-4 text-xs font-bold text-[#35413b] shadow-sm sm:flex">Log in</Link>
              <Link href="/v2/register" className="hidden h-9 items-center rounded-md bg-[#d65f45] px-4 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b] sm:flex">Sign up</Link>
            </>}
            <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-md border border-[#dfe3df] xl:hidden" aria-expanded={open} aria-label="Toggle navigation">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="grid border-t border-[#e6e9e6] bg-white p-3 xl:hidden" aria-label="Sajivo mobile menu">
            {visibleNavigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-[#4f5955] hover:bg-[#f3f5f3]">
                <Icon size={17} /> {label}
              </Link>
            ))}
            {profile ? <><div className="mt-2 border-t border-[#e6e9e6] px-3 pt-3"><p className="text-sm font-extrabold">{profile.full_name || "Sajivo member"}</p><p className="mt-1 text-xs text-[#737e78]">Signed in · {roleLabel}</p></div><Link href={workspaceHref} onClick={() => setOpen(false)} className="mt-2 rounded-md bg-[#d65f45] px-4 py-3 text-center text-sm font-bold text-white">Open workspace</Link><button type="button" onClick={logout} className="mt-2 flex items-center justify-center gap-2 rounded-md border border-[#e3c8c0] px-4 py-3 text-sm font-bold text-[#a23d2a]"><LogOut size={15} />Log out</button></> : <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#e6e9e6] pt-3"><Link href="/login" onClick={() => setOpen(false)} className="rounded-md border border-[#dfe3df] px-4 py-3 text-center text-sm font-bold">Log in</Link><Link href="/v2/register" onClick={() => setOpen(false)} className="rounded-md bg-[#d65f45] px-4 py-3 text-center text-sm font-bold text-white">Sign up</Link></div>}
          </nav>
        ) : null}
      </header>

      <main className="min-h-[calc(100vh-70px)] pb-20 md:pb-0">{children}</main>

      {profile ? <nav className="fixed inset-x-0 bottom-0 z-50 grid h-[68px] grid-cols-6 border-t border-[#dfe3df] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="V2 mobile navigation">
        {visibleNavigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/v2" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[9px] font-bold ${active ? "text-[#d65f45]" : "text-[#6d7571]"}`}>
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav> : null}
    </div>
  );
}

export function WorkspaceHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#e0e4e0] bg-white px-5 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#d65f45]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-normal text-[#1d2824] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68716d]">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-[#ccd2ce] bg-white p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#eef2ef] text-[#53605b]"><Search size={19} /></span>
        <h2 className="mt-4 text-base font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#727b77]">{description}</p>
      </div>
    </div>
  );
}

export const v2RoleOptions = [
  { label: "Customer", description: "Plan, compare and manage a project", icon: CircleUserRound },
  { label: "Professional", description: "Design or execute projects", icon: UsersRound },
  { label: "Vendor", description: "Sell products and materials", icon: WalletCards },
] as const;
