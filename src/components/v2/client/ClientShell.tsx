"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, ChevronDown, CircleHelp, ClipboardList, CreditCard, FileText, FolderKanban, Home, LogOut, Menu, MessageSquare, Plus, Search, Settings, Star, User, X } from "lucide-react";
import styles from "./ClientOS.module.css";
import { SajivoLogo } from "@/components/brand/SajivoLogo";

const workspace = [
  ["Overview", "/v2/client", Home], ["Projects", "/v2/client/projects", BriefcaseBusiness],
  ["My requirements", "/v2/client/requirements", ClipboardList], ["Proposals", "/v2/client/proposals", FolderKanban],
  ["Documents & payments", "/v2/client/documents-payments", FileText], ["Messages", "/v2/client/messages", MessageSquare],
  ["Reviews", "/v2/client/reviews", Star],
] as const;
const account = [["Profile", "/v2/client/profile", User], ["Settings", "/v2/client/settings", Settings]] as const;

export function ClientShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname(); const router=useRouter(); const [open,setOpen]=useState(false);
  const [profile,setProfile]=useState<{full_name?:string;email?:string}|null>(null);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store"}).then(async response=>response.ok?response.json():null).then(payload=>{if(active)setProfile(payload?.profile??null)}).catch(()=>undefined);return()=>{active=false}},[]);
  const initials=profile?.full_name?.split(" ").map(word=>word[0]).join("").slice(0,2).toUpperCase()||"SJ";
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh()}
  const nav=(items:typeof workspace|typeof account)=>items.map(([label,href,Icon])=>{
    const active=href==="/v2/client"?pathname===href:pathname.startsWith(href);
    return <Link key={href} href={href} onClick={()=>setOpen(false)} className={`${styles.navLink} ${active?styles.navActive:""}`}><Icon size={16}/><span>{label}</span></Link>
  });
  return <div className={styles.shell}>
    {open&&<button aria-label="Close navigation" className={styles.mobileOverlay} onClick={()=>setOpen(false)}/>} 
    <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:""}`}>
      <div className={styles.brand}><SajivoLogo compact/><button aria-label="Close navigation" className={`${styles.iconButton} ${styles.mobileButton}`} style={{marginLeft:"auto"}} onClick={()=>setOpen(false)}><X size={18}/></button></div>
      <Link href="/v2/client/profile" className={styles.account}><span className={styles.avatar}>{initials}</span><span className={styles.accountCopy}><strong>{profile?.full_name||"Your account"}</strong><span>Customer workspace</span></span><ChevronDown size={14}/></Link>
      <nav className={styles.nav}><p className={styles.navLabel}>Workspace</p>{nav(workspace)}<p className={styles.navLabel}>Account</p>{nav(account)}</nav>
      <div className={styles.sideFooter}><Link href="/v2/support" className={styles.navLink}><CircleHelp size={16}/>Help & support</Link><button type="button" onClick={logout} className={styles.navLink}><LogOut size={16}/>Log out</button></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><button aria-label="Open navigation" className={`${styles.iconButton} ${styles.mobileButton}`} onClick={()=>setOpen(true)}><Menu size={20}/></button><div className={styles.search}><Search size={15}/><span>Search your projects and files</span><kbd>⌘ K</kbd></div><div className={styles.topActions}><button aria-label="Notifications" className={styles.iconButton}><Bell size={18}/></button><Link href="/customer/dashboard/projects/new" className={styles.primaryButton}><Plus size={15}/><span>New project</span></Link><span className={styles.avatar}>{initials}</span></div></header>
      <main className={styles.content}>{children}</main>
    </div>
  </div>
}
