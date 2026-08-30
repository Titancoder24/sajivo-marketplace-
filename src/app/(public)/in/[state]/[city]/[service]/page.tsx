import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, ClipboardList, MapPin, ShieldCheck, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Params = { state: string; city: string; service: string };
type Faq = { question: string; answer: string };

async function getPage(params: Params) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("seo_pages").select("*").eq("state_slug", params.state).eq("city_slug", params.city).eq("service_slug", params.service).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = await getPage(await params);
  if (!page) return {};
  const canonical = page.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app"}${page.route_path}`;
  return { title: page.title, description: page.meta_description, alternates: { canonical }, openGraph: { title: page.title, description: page.meta_description, url: canonical, type: "website" } };
}

export default async function LocalServicePage({ params }: { params: Promise<Params> }) {
  const page = await getPage(await params);
  if (!page) notFound();
  const faq = (Array.isArray(page.faq) ? page.faq : []) as Faq[];
  const canonical = page.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app"}${page.route_path}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "Service", name: page.service_name, areaServed: { "@type": "City", name: page.city_name }, provider: { "@type": "Organization", name: "Sajivo", url: process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app" }, description: page.meta_description, url: canonical };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <main className="bg-[#f5f7f5] text-[#1d2824]"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <section className="relative min-h-[620px] overflow-hidden bg-[#15201c] text-white"><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,15,.94),rgba(11,18,15,.56),rgba(11,18,15,.2)),url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center" /><div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-5 py-16 sm:px-8"><div className="flex items-center gap-2 text-xs font-bold text-white/72"><MapPin size={15} />{page.city_name}, {page.state_name}</div><h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">{page.h1}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">{page.introduction}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={`/v2/register?city=${page.city_slug}&service=${page.service_slug}`} className="flex h-12 items-center gap-2 rounded-md bg-[#d65f45] px-5 text-sm font-bold shadow-[0_4px_0_#913624]">Start a project <ArrowRight size={17} /></Link><Link href={`/professionals?city=${page.city_slug}&service=${page.service_slug}`} className="flex h-12 items-center gap-2 rounded-md border border-white/35 bg-white/10 px-5 text-sm font-bold backdrop-blur">Find professionals</Link></div><div className="mt-10 flex flex-wrap gap-5 text-xs font-semibold text-white/72"><span className="flex items-center gap-2"><BadgeCheck size={16} />Verified profiles</span><span className="flex items-center gap-2"><ClipboardList size={16} />Structured proposals</span><span className="flex items-center gap-2"><ShieldCheck size={16} />Managed workspace</span></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#d65f45]">Local project guidance</p><h2 className="mt-3 text-3xl font-extrabold">Plan with clearer local context</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-[#66716c]">{page.local_insights}</p><div className="mt-10 grid gap-3 sm:grid-cols-3">{[[BadgeCheck,"Verified marketplace","Review professional identity and marketplace information."],[Star,"Compare fit","Evaluate structured proposals, terms, and experience."],[ClipboardList,"Manage delivery","Keep tasks, files, milestones, and messages together."]].map(([Icon,title,text]) => <article key={String(title)} className="rounded-md border border-[#dce2dd] bg-white p-5"><Icon size={21} className="text-[#d65f45]" /><h3 className="mt-4 text-sm font-extrabold">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-[#6d7772]">{String(text)}</p></article>)}</div></div><aside className="rounded-md border border-[#ccd7d0] bg-[#eaf2ed] p-6"><p className="text-xs font-bold text-[#426052]">Targeting</p><h2 className="mt-2 text-xl font-extrabold">{page.city_name} project search</h2><div className="mt-5 flex flex-wrap gap-2">{(page.target_keywords as string[]).map((keyword) => <span key={keyword} className="rounded bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#53635b]">{keyword}</span>)}</div></aside></div></section>
    <section className="border-y border-[#dfe4e0] bg-white"><div className="mx-auto max-w-5xl px-5 py-16 sm:px-8"><p className="text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#d65f45]">Frequently asked</p><h2 className="mt-3 text-center text-3xl font-extrabold">Helpful answers for {page.city_name}</h2><div className="mt-9 divide-y divide-[#e3e7e4] border-y border-[#e3e7e4]">{faq.map((item) => <article key={item.question} className="py-6"><h3 className="text-sm font-extrabold">{item.question}</h3><p className="mt-2 text-sm leading-7 text-[#68736d]">{item.answer}</p></article>)}</div></div></section>
  </main>;
}
