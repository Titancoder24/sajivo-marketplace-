"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/sajivo/BrandMark";

const links = [
  ["Explore", "/services"],
  ["Professionals", "/professionals"],
  ["How Sajivo Works", "/how-it-works"],
  ["For professionals", "/for-professionals"],
] as const;

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="page-shell flex h-[72px] items-center justify-between gap-5">
          <BrandMark />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map(([label, href]) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rv-focus rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-[var(--rv-bg)] text-[var(--rv-ink)]" : "text-[var(--rv-ink-2)] hover:bg-[var(--rv-bg)] hover:text-[var(--rv-ink)]"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/professionals" aria-label="Search professionals" className="button-3d button-depth-outline rv-focus hidden h-10 items-center gap-2 rounded-full border border-[var(--rv-border)] bg-white px-4 text-sm font-semibold sm:flex lg:hidden">
              <Search size={16} /> Search
            </Link>
            <Link href="/login" className="rv-focus hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-[var(--rv-bg)] md:block">Log in</Link>
            <Link href="/register" className="button-3d button-depth-secondary rv-focus hidden rounded-full bg-[var(--rv-slate)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--rv-slate-2)] md:block">Sign up</Link>
            <button className="rv-focus grid h-10 w-10 place-items-center rounded-full border border-[var(--rv-border)] md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-[var(--rv-border)] bg-white md:hidden">
            <div className="page-shell grid gap-1 py-3">
              {links.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[var(--rv-bg)]" onClick={() => setOpen(false)}>{label}</Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--rv-border)] pt-3">
                <Link href="/login" className="rounded-lg border border-[var(--rv-border)] px-4 py-3 text-center text-sm font-semibold" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/register" className="rounded-lg bg-[var(--rv-slate)] px-4 py-3 text-center text-sm font-semibold text-white" onClick={() => setOpen(false)}>Sign up</Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-[68px] grid-cols-4 border-t border-black/10 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {[
          [Home, "Explore", "/"],
          [Search, "Find pros", "/professionals"],
          [Heart, "Services", "/services"],
          [UserRound, "Account", "/login"],
        ].map(([Icon, label, href]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href as string);
          return (
            <Link key={label as string} href={href as string} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? "text-[var(--rv-terracotta)]" : "text-[var(--rv-ink-2)]"}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label as string}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
