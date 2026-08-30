"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3, Bell, BriefcaseBusiness, ChevronDown, CircleDollarSign,
  FileText, FolderKanban, Gift, Home, Menu, MessageCircle, Search,
  Settings, ShieldCheck, Users, Wrench, LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./professional.module.css";
import { SajivoLogo } from "@/components/brand/SajivoLogo";

const links = [
  { label: "Overview", href: "/v2/professional", icon: Home },
  { label: "Opportunities", href: "/v2/professional/opportunities", icon: BriefcaseBusiness },
  { label: "My Proposals", href: "/v2/professional/proposals", icon: FileText },
  { label: "Active Projects", href: "/v2/professional/projects", icon: FolderKanban },
  { label: "Team & Workforce", href: "/v2/professional/team", icon: Users },
  { label: "Documents", href: "/v2/professional/documents", icon: FileText },
  { label: "Payments & Invoices", href: "/v2/professional/finance", icon: CircleDollarSign },
  { label: "Reports & Analytics", href: "/v2/professional/analytics", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  return href === "/v2/professional" ? pathname === href : pathname.startsWith(href);
}

export function ProfessionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile,setProfile]=useState<{full_name?:string;business_name?:string;business_role?:string;primary_role?:string;verification_status?:string}|null>(null);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store"}).then(async response=>response.ok?response.json():null).then(payload=>{if(active)setProfile(payload?.profile??null)}).catch(()=>undefined);return()=>{active=false}},[]);
  const name=profile?.business_name||profile?.full_name||"Your business";
  const initials=name.split(" ").map(word=>word[0]).join("").slice(0,2).toUpperCase();
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh()}
  return (
    <div className={styles.shell} data-professional-v2>
      <style>{`
        body:has([data-professional-v2]) > div > header.sticky { display: none; }
        body:has([data-professional-v2]) nav[aria-label="V2 mobile navigation"],
        body:has([data-professional-v2]) > aside[aria-label="Appearance and language preferences"] { display: none; }
        body:has([data-professional-v2]) > div > main { min-height: 100vh; padding-bottom: 0; }
      `}</style>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><SajivoLogo compact/></div>
        <div className={styles.profile}>
          <span className={styles.avatar}>{initials||"SJ"}</span>
          <span><span className={styles.profileName}>{name}</span><span className={styles.profileMeta}>{profile?.verification_status==="verified"?"Verified ":""}{(profile?.business_role||profile?.primary_role||"Professional").replaceAll("_"," ")} {profile?.verification_status==="verified"&&<ShieldCheck className={styles.verified} size={11}/>}</span></span>
          <ChevronDown size={14} />
        </div>
        <nav className={styles.nav}>
          {links.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={`${styles.navLink} ${isActive(pathname, href) ? styles.navActive : ""}`}>
              <Icon size={16} strokeWidth={1.9} /><span>{label}</span>
            </Link>
          ))}
          <p className={styles.navSection}>Business</p>
          <Link href="/v2/professional/settings" className={`${styles.navLink} ${isActive(pathname, "/v2/professional/settings") ? styles.navActive : ""}`}><Settings size={16} />Settings</Link>
          <a className={styles.navLink} href="#"><Wrench size={16} />Equipment</a>
          <button type="button" onClick={logout} className={styles.navLink}><LogOut size={16} />Log out</button>
        </nav>
        <div className={styles.support}><strong>Need help?</strong><span>Angel AI Support</span></div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <Link href="/v2/professional" className={styles.mobileBrand}><SajivoLogo compact/></Link>
          <button className={styles.search}><Search size={15} />Search projects, clients, tasks, documents...<kbd>⌘ K</kbd></button>
          <div className={styles.topActions}>
            <button className={styles.referButton}><Gift size={15} />Refer & Earn</button>
            <button className={styles.iconButton} aria-label="Notifications"><Bell size={17}/></button>
            <button className={styles.iconButton} aria-label="Messages"><MessageCircle size={17} /></button>
            <span className={styles.avatarSmall}>{initials||"SJ"}</span>
            <button className={styles.iconButton} aria-label="Open menu"><Menu size={17} /></button>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>

      <nav className={styles.mobileNav}>
        {links.slice(0,4).map(({label,href,icon:Icon}) => <Link key={href} href={href} className={isActive(pathname,href) ? styles.mobileActive : ""}><Icon size={19}/><span>{label.replace("My ","")}</span></Link>)}
        <Link href="/v2/professional/settings" className={isActive(pathname,"/v2/professional/settings") ? styles.mobileActive : ""}><Settings size={19}/><span>Settings</span></Link>
      </nav>
    </div>
  );
}
