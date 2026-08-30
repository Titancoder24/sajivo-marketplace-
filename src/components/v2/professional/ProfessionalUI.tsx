import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ChevronDown, Search } from "lucide-react";
import styles from "./professional.module.css";

export type Tone = "blue" | "green" | "orange" | "purple" | "red" | "teal";

export function PageHeader({ title, subtitle, action = "New", secondary = "Filters" }: { title: string; subtitle: string; action?: string; secondary?: string }) {
  return <div className={styles.pageHeader}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.headerActions}><button className={styles.button}>{secondary}<ChevronDown size={14}/></button><button className={styles.buttonPrimary}>{action}<ChevronDown size={14}/></button></div></div>;
}

export function Stat({ label, value, trend, icon: Icon, tone = "blue", spark = false }: { label: string; value: string; trend: string; icon: LucideIcon; tone?: Tone; spark?: boolean }) {
  return <div className={styles.stat}><div className={styles.statTop}><span className={`${styles.statIcon} ${styles[tone]}`}><Icon size={19}/></span><div><div className={styles.statLabel}>{label}</div><div className={styles.statValue}>{value}</div></div></div><div className={styles.statTrend}><span className={trend.startsWith("-") ? styles.down : styles.up}>{trend.startsWith("-") ? trend : `↑ ${trend}`}</span> vs last period</div>{spark && <svg className={styles.spark} viewBox="0 0 160 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 19 L14 16 L27 18 L41 10 L54 14 L68 5 L82 12 L96 8 L110 15 L124 9 L139 13 L160 6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".65"/></svg>}</div>;
}

export function Panel({ title, link, children, className = "" }: { title: string; link?: string; children: React.ReactNode; className?: string }) {
  return <section className={`${styles.panel} ${className}`}><div className={styles.panelHeader}><h2 className={styles.panelTitle}>{title}</h2>{link && <button className={styles.panelLink}>{link} <ArrowUpRight size={10}/></button>}</div>{children}</section>;
}

export const legendColors = ["#2f80ed", "#12ad78", "#ff9f1a", "#8b46d8", "#c7cbd3", "#ef4f4f"];

export function Donut({ total, suffix = "Total", items }: { total: string; suffix?: string; items: Array<[string,string]> }) {
  return <div className={styles.chartRow}><div className={styles.donut}><span className={styles.donutCenter}><strong>{total}</strong>{suffix}</span></div><div className={styles.legend}>{items.map(([name,value],i)=><div className={styles.legendItem} key={name}><span className={styles.legendDot} style={{background:legendColors[i%legendColors.length]}}/><span>{name}</span><strong>{value}</strong></div>)}</div></div>;
}

export function Funnel({ items }: { items: Array<[string,string,number]> }) {
  return <div className={`${styles.panelBody} ${styles.funnel}`}>{items.map(([name,value,width],i)=><div className={styles.funnelRow} key={name}><div className={styles.funnelBar} style={{width:`${width}%`,background:legendColors[i%legendColors.length]}}/><div className={styles.funnelLabel}><span>{name}</span><strong>{value}</strong></div></div>)}</div>;
}

export function Bars({ items }: { items: Array<[string,string,number,Tone?]> }) {
  return <div className={`${styles.panelBody} ${styles.barList}`}>{items.map(([name,value,width,tone="blue"]) => <div key={name}><div className={styles.barLabel}><span>{name}</span><strong>{value}</strong></div><div className={styles.track}><div className={`${styles.fill} ${styles[tone]}`} style={{width:`${width}%`}}/></div></div>)}</div>;
}

export function Tabs({ items }: { items: string[] }) { return <div className={styles.tabs}>{items.map((x,i)=><button key={x} className={`${styles.tab} ${i===0?styles.tabActive:""}`}>{x}</button>)}</div>; }
export function Toolbar() { return <div className={styles.toolbar}><button className={styles.button}>Sort: Newest <ChevronDown size={12}/></button><button className={styles.button}>All status <ChevronDown size={12}/></button><button className={styles.search}><Search size={14}/>Search...</button></div>; }

export function Status({ children, tone = "Green" }: { children: React.ReactNode; tone?: "Green"|"Blue"|"Orange"|"Red"|"Gray" }) { return <span className={`${styles.status} ${styles[`status${tone}`]}`}>{children}</span>; }

export function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <><div className={styles.tableWrap}><table className={styles.table}><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div><div className={styles.tableFooter}><span>Showing 1 to {rows.length} of 28 results</span><span>‹ &nbsp; <strong>1</strong> &nbsp; 2 &nbsp; 3 &nbsp; ›</span><span>Rows per page: 10</span></div></>;
}

export function Person({ initials, name, detail }: { initials: string; name: string; detail?: string }) { return <span className={styles.person}><span className={styles.avatarSmall}>{initials}</span><span><strong>{name}</strong>{detail&&<span className={styles.subtext}>{detail}</span>}</span></span>; }

export function SideList({ items }: { items: Array<[LucideIcon,string,string,string?]> }) { return <div className={styles.list}>{items.map(([Icon,title,detail,value])=><div className={styles.listItem} key={title}><span className={styles.listItemIcon}><Icon size={14}/></span><span className={styles.listText}><strong>{title}</strong><span>{detail}</span></span>{value&&<span className={styles.listValue}>{value}</span>}</div>)}</div>; }
