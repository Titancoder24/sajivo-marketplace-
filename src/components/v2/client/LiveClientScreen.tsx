import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, BriefcaseBusiness, FileText, FolderKanban, IndianRupee, MessageSquare, Plus, ShieldCheck, Star, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClientProfileEditor } from "./ClientProfileEditor";

type Mode = "overview" | "projects" | "requirements" | "proposals" | "documents" | "messages" | "reviews" | "profile" | "settings";

function money(value: unknown) {
  return typeof value === "number" || typeof value === "string"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value))
    : "Not set";
}

function date(value: unknown) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(value))) : "Not set";
}

function Heading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-b border-[#e3e7e4] pb-6 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-extrabold text-[#1d2824]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7772]">{description}</p></div>{action}</header>;
}

function Empty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <section className="grid min-h-72 place-items-center border border-dashed border-[#ccd4cf] bg-white p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf2ef] text-[#496056]"><FolderKanban size={20}/></span><h2 className="mt-4 text-base font-extrabold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#707a75]">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div></section>;
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#d65f45] px-4 text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b]">{children}</Link>;
}

async function rowsWhen<T>(needed: boolean, query: PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  if (!needed) return [];
  const { data } = await query;
  return data ?? [];
}

export async function LiveClientScreen({ mode }: { mode: Mode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const userId = auth.user.id;

  const [profileResult, projects, requirements, proposals, documents, notifications, reviews] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,phone,city,state,bio,account_status,verification_status,person_public_id,account_public_id,created_at").eq("id", userId).single(),
    rowsWhen(mode === "overview" || mode === "projects", supabase.from("projects").select("id,title,status,city,state,budget_range,custom_budget,expected_timeline,created_at,updated_at").eq("customer_id", userId).order("updated_at", { ascending: false })),
    rowsWhen(mode === "overview" || mode === "requirements", supabase.from("requirements").select("id,public_id,title,project_type,status,budget,location,created_at,updated_at").eq("customer_id", userId).order("updated_at", { ascending: false })),
    rowsWhen(mode === "overview" || mode === "proposals", supabase.from("proposals").select("id,status,proposed_amount,proposed_amount_min,proposed_amount_max,estimated_timeline,created_at,project:projects!project_id(title),professional:profiles!professional_id(full_name,business_name,rating_avg)").eq("customer_id", userId).order("created_at", { ascending: false })),
    rowsWhen(mode === "overview" || mode === "documents", supabase.from("financial_documents").select("id,public_id,document_type,document_number,total_amount,amount_paid,status,issuer_name,created_at").eq("account_id", userId).order("created_at", { ascending: false })),
    rowsWhen(mode === "overview" || mode === "messages" || mode === "settings", supabase.from("notifications").select("id,kind,message,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30)),
    rowsWhen(mode === "reviews", supabase.from("reviews").select("id,rating,review_text,created_at,professional:profiles!professional_id(full_name,business_name)").eq("customer_id", userId).order("created_at", { ascending: false })),
  ]);

  const profile = profileResult.data;

  if (mode === "overview") {
    const activeProjects = projects.filter((item) => !["completed", "cancelled", "archived", "draft"].includes(item.status)).length;
    const dueAmount = documents.reduce((sum, item) => sum + Math.max(0, Number(item.total_amount) - Number(item.amount_paid)), 0);
    const stats = [[BriefcaseBusiness,"Active projects",activeProjects],[FileText,"Requirements",requirements.length],[FolderKanban,"Proposals",proposals.length],[IndianRupee,"Outstanding",money(dueAmount)],[Bell,"Unread",notifications.filter((item)=>!item.read_at).length]] as const;
    return <div className="space-y-6"><Heading title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "there"}`} description="This workspace shows only activity connected to your authenticated Sajivo account." action={<PrimaryLink href="/customer/dashboard/projects/new"><Plus size={14}/>Start a project</PrimaryLink>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([Icon,label,value])=><section key={label} className="border border-[#e0e5e1] bg-white p-4"><Icon size={17} className="text-[#d65f45]"/><p className="mt-4 text-[10px] font-bold uppercase text-[#7c8681]">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p></section>)}</div>{projects.length ? <section className="border border-[#e0e5e1] bg-white"><div className="flex items-center justify-between border-b border-[#e8ebe9] p-5"><h2 className="text-sm font-extrabold">Recent projects</h2><Link href="/v2/client/projects" className="text-xs font-bold text-[#c94f37]">View all</Link></div><div className="divide-y divide-[#edf0ee]">{projects.slice(0,5).map((item)=><Link key={item.id} href={`/v2/projects/${item.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 text-xs hover:bg-[#f8faf8]"><strong className="min-w-0 flex-1">{item.title || "Untitled project"}</strong><span className="text-[#75807a]">{item.city || "Location pending"}</span><span className="rounded-full bg-[#eef3f0] px-2 py-1 font-bold capitalize">{item.status.replaceAll("_"," ")}</span><ArrowRight size={14}/></Link>)}</div></section> : <Empty title="Your workspace is ready" description="No projects or sample records have been inserted. Start your first project to create a real requirement, receive proposals and open a managed workspace." action={<PrimaryLink href="/customer/dashboard/projects/new">Create first project</PrimaryLink>}/>}</div>;
  }

  if (mode === "projects") return <div className="space-y-6"><Heading title="My projects" description="Projects created by this signed-in customer account." action={<PrimaryLink href="/customer/dashboard/projects/new"><Plus size={14}/>New project</PrimaryLink>}/>{projects.length ? <div className="grid gap-3 lg:grid-cols-2">{projects.map((item)=><Link href={`/v2/projects/${item.id}`} key={item.id} className="border border-[#dfe5e1] bg-white p-5 hover:border-[#aebcb4]"><div className="flex items-start justify-between gap-4"><div><h2 className="font-extrabold">{item.title || "Untitled project"}</h2><p className="mt-2 text-xs text-[#717b76]">{[item.city,item.state].filter(Boolean).join(", ") || "Location pending"}</p></div><span className="rounded-full bg-[#edf3ef] px-2.5 py-1 text-[10px] font-bold capitalize">{item.status.replaceAll("_"," ")}</span></div><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#edf0ee] pt-4 text-xs"><div><span className="text-[#7a847f]">Budget</span><strong className="mt-1 block">{item.custom_budget ? money(item.custom_budget) : item.budget_range || "Not set"}</strong></div><div><span className="text-[#7a847f]">Timeline</span><strong className="mt-1 block">{item.expected_timeline || "Not set"}</strong></div></div></Link>)}</div> : <Empty title="No projects yet" description="Your projects will appear here after you create and save a project brief." action={<PrimaryLink href="/customer/dashboard/projects/new">Start a project</PrimaryLink>}/>}</div>;

  if (mode === "requirements") return <div className="space-y-6"><Heading title="My requirements" description="Structured requirements published from your account." action={<PrimaryLink href="/customer/dashboard/projects/new"><Plus size={14}/>Create requirement</PrimaryLink>}/>{requirements.length ? <div className="divide-y divide-[#e7ebe8] border border-[#dfe5e1] bg-white">{requirements.map((item)=><div key={item.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto]"><div><p className="text-[10px] font-bold text-[#d65f45]">{item.public_id}</p><h2 className="mt-1 font-extrabold">{item.title}</h2><p className="mt-2 text-xs text-[#75807a]">{item.project_type} · Updated {date(item.updated_at)}</p></div><span className="h-fit rounded-full bg-[#edf3ef] px-2.5 py-1 text-[10px] font-bold capitalize">{item.status.replaceAll("_"," ")}</span></div>)}</div> : <Empty title="No requirements published" description="Build your first brief. Saved and published requirements will be loaded from Supabase here." action={<PrimaryLink href="/customer/dashboard/projects/new">Create requirement</PrimaryLink>}/>}</div>;

  if (mode === "proposals") return <div className="space-y-6"><Heading title="Proposals" description="Professional responses received for your real project requirements."/>{proposals.length ? <div className="grid gap-3 lg:grid-cols-2">{proposals.map((item)=>{const professional=Array.isArray(item.professional)?item.professional[0]:item.professional;const project=Array.isArray(item.project)?item.project[0]:item.project;return <article key={item.id} className="border border-[#dfe5e1] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-extrabold">{professional?.business_name || professional?.full_name || "Sajivo professional"}</h2><p className="mt-1 text-xs text-[#77817c]">{project?.title || "Project"}</p></div><span className="rounded-full bg-[#edf3ef] px-2 py-1 text-[10px] font-bold capitalize">{item.status.replaceAll("_"," ")}</span></div><p className="mt-5 text-xl font-extrabold">{item.proposed_amount ? money(item.proposed_amount) : `${money(item.proposed_amount_min)} – ${money(item.proposed_amount_max)}`}</p><p className="mt-2 text-xs text-[#707a75]">{item.estimated_timeline}</p></article>})}</div> : <Empty title="No proposals yet" description="Proposals will appear only after an eligible professional responds to one of your published requirements."/>}</div>;

  if (mode === "documents") return <div className="space-y-6"><Heading title="Documents & payments" description="Invoices, receipts and financial records issued to your account."/>{documents.length ? <div className="overflow-x-auto border border-[#dfe5e1] bg-white"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#f5f7f5] text-[10px] uppercase text-[#79837e]"><tr><th className="p-4">Document</th><th className="p-4">Issuer</th><th className="p-4">Total</th><th className="p-4">Paid</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-[#ebefec]">{documents.map((item)=><tr key={item.id}><td className="p-4"><strong>{item.document_number}</strong><span className="mt-1 block capitalize text-[#79837e]">{item.document_type.replaceAll("_"," ")}</span></td><td className="p-4">{item.issuer_name}</td><td className="p-4 font-bold">{money(item.total_amount)}</td><td className="p-4">{money(item.amount_paid)}</td><td className="p-4 capitalize">{item.status.replaceAll("_"," ")}</td></tr>)}</tbody></table></div> : <Empty title="No financial documents" description="Verified invoices, receipts and payment records will appear here when your project reaches a billable milestone."/>}</div>;

  if (mode === "messages") return <div className="space-y-6"><Heading title="Messages & notifications" description="Account and project updates delivered to this signed-in user."/>{notifications.length ? <div className="divide-y divide-[#e8ece9] border border-[#dfe5e1] bg-white">{notifications.map((item)=><article key={item.id} className="flex gap-3 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf3ef]"><MessageSquare size={15}/></span><div><p className="text-sm font-semibold">{item.message}</p><p className="mt-1 text-[10px] text-[#7b8580]">{date(item.created_at)} · {item.read_at ? "Read" : "Unread"}</p></div></article>)}</div> : <Empty title="No messages yet" description="Project messages and account notifications will appear after real workspace activity begins."/>}</div>;

  if (mode === "reviews") return <div className="space-y-6"><Heading title="Reviews" description="Reviews submitted from your completed Sajivo projects."/>{reviews.length ? <div className="grid gap-3 lg:grid-cols-2">{reviews.map((item)=>{const professional=Array.isArray(item.professional)?item.professional[0]:item.professional;return <article key={item.id} className="border border-[#dfe5e1] bg-white p-5"><div className="flex gap-1 text-[#e6a318]">{Array.from({length:item.rating},(_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div><p className="mt-4 text-sm leading-6">{item.review_text}</p><p className="mt-4 text-xs font-bold">{professional?.business_name || professional?.full_name || "Professional"}</p></article>})}</div> : <Empty title="No reviews submitted" description="After a project is completed, your verified review will be stored and displayed here."/>}</div>;

  if (mode === "profile" && profile) return <ClientProfileEditor initialProfile={profile} />;

  return <div className="space-y-6"><Heading title="Settings" description="Security and account controls for this signed-in identity."/><div className="grid gap-3 md:grid-cols-3">{[[ShieldCheck,"Account security",profile?.verification_status || "unverified"],[UserRound,"Identity",profile?.person_public_id || "Not assigned"],[Bell,"Notifications",`${notifications.filter((item)=>!item.read_at).length} unread`]].map(([Icon,title,value])=><section key={title as string} className="border border-[#dfe5e1] bg-white p-5"><Icon size={18} className="text-[#d65f45]"/><h2 className="mt-4 text-sm font-extrabold">{title as string}</h2><p className="mt-2 text-xs capitalize text-[#74807a]">{value as string}</p></section>)}</div></div>;
}
