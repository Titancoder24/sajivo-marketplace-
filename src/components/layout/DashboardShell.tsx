"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PackageSearch,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Star,
  User,
  UserRoundCheck,
  ShoppingBag,
  Calculator,
  CreditCard,
} from "lucide-react";
import { BrandMark } from "@/components/sajivo/BrandMark";
import { roleLabels } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

const iconMap = {
  overview: LayoutDashboard,
  projects: FolderOpen,
  discover: Search,
  proposals: ClipboardList,
  active: BriefcaseBusiness,
  portfolio: Star,
  verifications: CheckCircle2,
  messages: MessageCircle,
  saved: UserRoundCheck,
  reviews: Star,
  opportunities: PackageSearch,
  quotations: ReceiptText,
  orders: ShoppingBag,
  catalog: FolderOpen,
  estimator: Calculator,
  credits: CreditCard,
  finance: ReceiptText,
  support: HelpCircle,
};

function linksFor(role: UserRole) {
  const base = `/${role}/dashboard`;
  if (role === "customer") {
    return [
      ["overview", "Overview", base],
      ["projects", "Projects", `${base}/projects`],
      ["estimator", "Budget estimator", `${base}/estimator`],
      ["finance", "Documents & payments", `${base}/finance`],
      ["credits", "Credits", `${base}/credits`],
      ["discover", "Find professionals", "/professionals"],
      ["messages", "Messages", `${base}/messages`],
      ["saved", "Saved", `${base}/saved`],
      ["reviews", "Reviews", `${base}/reviews`],
    ] as const;
  }
  if (role === "vendor") {
    return [
      ["overview", "Overview", base],
      ["opportunities", "Enquiries", `${base}/opportunities`],
      ["quotations", "Quotations", `${base}/quotations`],
      ["orders", "Orders", `${base}/orders`],
      ["catalog", "Product catalog", `${base}/catalog`],
      ["verifications", "Verification", `${base}/verifications`],
      ["messages", "Messages", `${base}/messages`],
    ] as const;
  }
  return [
    ["overview", "Overview", base],
    ["discover", "Discover", `${base}/discover`],
    ["proposals", role === "designer" ? "Proposals" : "Quotations", role === "designer" ? `${base}/proposals` : `${base}/quotations`],
    ["active", "Active projects", `${base}/active`],
    ["portfolio", "Portfolio", `${base}/portfolio`],
    ["verifications", "Verifications", `${base}/verifications`],
    ["messages", "Messages", `${base}/messages`],
  ] as const;
}

function isActive(pathname: string, href: string, dashboardRoot: string) {
  if (href === dashboardRoot) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ role, children, userName: suppliedUserName, businessName: suppliedBusinessName, unreadNotifications = 0 }: { role: UserRole; children: React.ReactNode; userName?: string; businessName?: string; unreadNotifications?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const userName = suppliedUserName ?? "Sajivo member";
  const businessName = suppliedBusinessName ?? (role === "customer" ? "Homeowner workspace" : `${roleLabels[role]} workspace`);
  const navLinks = linksFor(role);
  const root = `/${role}/dashboard`;
  const quickAction = role === "customer" ? "/customer/dashboard/projects/new" : role === "vendor" ? `${root}/catalog` : `${root}/discover`;
  const mobileLinks = role === "customer"
    ? [navLinks[0], navLinks[1], navLinks[2], navLinks[3]]
    : [navLinks[0], navLinks[1], navLinks[2], navLinks[3]];
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#202124]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-[#e6e7e9] bg-[#fbfbfc] lg:flex">
        <div className="flex h-16 items-center border-b border-[#e6e7e9] px-5">
          <BrandMark />
        </div>

        <div className="px-3 py-3">
          <button className="rv-focus flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#f0f0f2]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1f2937] text-xs font-bold text-white">{initials(businessName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{businessName}</span>
              <span className="block truncate text-[11px] text-[#7a7d82]">{roleLabels[role]}</span>
            </span>
            <ChevronDown size={14} className="text-[#8b8d92]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#9a9ca1]">Workspace</p>
          <div className="space-y-0.5">
            {navLinks.map(([key, label, href]) => {
              const Icon = iconMap[key];
              const active = isActive(pathname, href, root);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rv-focus group flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium text-[#5f6368] transition-colors hover:bg-[#f0f0f2] hover:text-[#202124]",
                    active && "bg-[#ececef] font-semibold text-[#202124]",
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />
                  <span className="truncate">{label}</span>
                  {key === "messages" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--rv-terracotta)]" />}
                </Link>
              );
            })}
          </div>

          <p className="mt-6 px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9a9ca1]">Account</p>
          <div className="space-y-0.5">
            <Link href="/notifications" className="rv-focus flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium text-[#5f6368] hover:bg-[#f0f0f2] hover:text-[#202124]">
              <Bell size={16} /><span>Notifications</span>{unreadNotifications > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#202124] px-1.5 text-[10px] font-bold text-white">{unreadNotifications}</span>}
            </Link>
            <Link href="/profile" className="rv-focus flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium text-[#5f6368] hover:bg-[#f0f0f2] hover:text-[#202124]"><User size={16} />Profile</Link>
            <Link href="/settings" className="rv-focus flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium text-[#5f6368] hover:bg-[#f0f0f2] hover:text-[#202124]"><Settings size={16} />Settings</Link>
          </div>
        </nav>

        <div className="border-t border-[#e6e7e9] p-3">
          <Link href={`${root}/support`} className="flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] text-[#6f7277] hover:bg-[#f0f0f2]"><HelpCircle size={16} />Help & support</Link>
          <button type="button" onClick={logout} className="flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-left text-[13px] text-[#6f7277] hover:bg-[#f0f0f2]"><LogOut size={16} />Log out</button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#e6e7e9] bg-white/95 px-4 backdrop-blur md:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden"><BrandMark /></div>
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0 lg:w-full">
            <button className="rv-focus hidden h-9 max-w-[360px] flex-1 items-center gap-2 rounded-md border border-[#dedfe2] bg-[#fafafa] px-3 text-left text-sm text-[#8a8d91] lg:flex">
              <Search size={15} /><span>Search projects, people, files...</span><kbd className="ml-auto rounded border border-[#ddd] bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
            </button>
            <div className="lg:ml-auto" />
            <Link href="/notifications" aria-label="Notifications" className="rv-focus relative flex h-9 w-9 items-center justify-center rounded-md text-[#5f6368] hover:bg-[#f2f2f3]">
              <Bell size={18} />{unreadNotifications > 0 && <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--rv-terracotta)] ring-2 ring-white" />}
            </Link>
            <Link href={quickAction} className="rv-focus ml-1 inline-flex h-9 items-center gap-2 rounded-md bg-[#202124] px-3 text-xs font-semibold text-white shadow-sm hover:bg-black">
              <Plus size={15} /> <span className="hidden sm:inline">{role === "customer" ? "New project" : role === "vendor" ? "Add product" : "Find work"}</span>
            </Link>
            <button aria-label="Open menu" className="rv-focus flex h-9 w-9 items-center justify-center rounded-md text-[#5f6368] hover:bg-[#f2f2f3] lg:hidden"><Menu size={19} /></button>
            <div className="ml-1 hidden items-center gap-2 border-l border-[#e5e5e5] pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e1dc] text-[11px] font-bold text-[#563d31]">{initials(userName)}</div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-6 md:px-6 md:pb-10 md:pt-7 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-[68px] grid-cols-5 border-t border-[#dedfe2] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileLinks.map(([key, label, href]) => {
          const Icon = iconMap[key];
          const active = isActive(pathname, href, root);
          const mobileLabel = key === "overview" ? "Home" : key === "discover" ? (role === "customer" ? "Find" : "Discover") : key === "proposals" ? (role === "designer" ? "Proposals" : "Quotes") : label;
          return (
            <Link key={href} href={href} className={cn("rv-focus flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#777a7f]", active && "text-[var(--rv-terracotta-dark)]")}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className="max-w-full truncate">{mobileLabel}</span>
            </Link>
          );
        })}
        <Link href="/profile" className={cn("rv-focus flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#777a7f]", pathname === "/profile" && "text-[var(--rv-terracotta-dark)]")}>
          <User size={20} /><span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
