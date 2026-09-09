import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  APPROVED_SEO_CITIES,
  buildProgrammaticSeoContent,
  PROGRAMMATIC_SEO_SLUGS,
  type SeoFaq,
  type SeoSection,
} from "@/lib/seo/programmatic";
import { createClient } from "@/lib/supabase/server";

type Params = { state: string; city: string; service: string };
type SeoPage = {
  id: string;
  state_slug: string;
  state_name: string;
  city_slug: string;
  city_name: string;
  service_slug: string;
  service_name: string;
  route_path: string;
  title: string;
  meta_description: string;
  h1: string;
  introduction: string;
  local_insights: string;
  faq: SeoFaq[] | null;
  canonical_url: string | null;
};

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app").replace(/\/$/, "");

function getApprovedFallback(params: Params): SeoPage | null {
  const location = APPROVED_SEO_CITIES.find(
    (item) => item.stateSlug === params.state && item.citySlug === params.city,
  );
  if (!location || !PROGRAMMATIC_SEO_SLUGS.includes(params.service)) return null;

  const content = buildProgrammaticSeoContent(params.service, location.city, location.state);
  if (!content || content.slug !== params.service) return null;

  const routePath = `/in/${location.stateSlug}/${location.citySlug}/${content.slug}`;
  return {
    id: `approved:${location.citySlug}:${content.slug}`,
    state_slug: location.stateSlug,
    state_name: location.state,
    city_slug: location.citySlug,
    city_name: location.city,
    service_slug: content.slug,
    service_name: content.serviceName,
    route_path: routePath,
    title: content.title,
    meta_description: content.description,
    h1: content.h1,
    introduction: content.introduction,
    local_insights: content.localInsights,
    faq: content.faq,
    canonical_url: `${appUrl}${routePath}`,
  };
}

async function getPage(params: Params) {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from("seo_pages")
      .select("id, state_slug, state_name, city_slug, city_name, service_slug, service_name, route_path, title, meta_description, h1, introduction, local_insights, faq, canonical_url")
      .eq("state_slug", params.state)
      .eq("city_slug", params.city)
      .eq("service_slug", params.service)
      .eq("status", "published")
      .maybeSingle();
    if (data) return data as SeoPage;
  }
  return getApprovedFallback(params);
}

async function getRelatedPages(page: SeoPage) {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from("seo_pages")
      .select("route_path, service_slug, service_name")
      .eq("state_slug", page.state_slug)
      .eq("city_slug", page.city_slug)
      .eq("status", "published")
      .in("service_slug", PROGRAMMATIC_SEO_SLUGS)
      .neq("id", page.id)
      .limit(4);
    if (data?.length) return data;
  }

  return PROGRAMMATIC_SEO_SLUGS
    .filter((slug) => slug !== page.service_slug)
    .slice(0, 4)
    .map((slug) => ({
      route_path: `/in/${page.state_slug}/${page.city_slug}/${slug}`,
      service_slug: slug,
      service_name: buildProgrammaticSeoContent(slug, page.city_name, page.state_name)?.serviceName ?? slug,
    }));
}

function pageContent(page: SeoPage) {
  const programmatic = buildProgrammaticSeoContent(page.service_slug, page.city_name, page.state_name);
  if (programmatic) return { ...programmatic, indexable: true };

  const faq = Array.isArray(page.faq) ? page.faq : [];
  const sections: SeoSection[] = [
    {
      heading: "Define the project brief",
      body: page.local_insights,
      points: ["Record scope, budget range and timeline", "List inclusions, exclusions and responsibilities", "Use the same brief for every proposal"],
    },
    {
      heading: "Compare available evidence",
      body: "Review relevant experience, proposal detail, team responsibility and commercial terms before making a project-specific decision.",
      points: ["Check comparable work and references", "Review specifications and assumptions", "Keep questions and answers in writing"],
    },
    {
      heading: "Manage delivery records",
      body: "Keep current files, milestones, approvals, changes, payments and handover information connected throughout delivery.",
      points: ["Assign owners and due dates", "Approve changes before work proceeds", "Close defects and documents at handover"],
    },
  ];
  return {
    slug: page.service_slug,
    serviceName: page.service_name,
    intent: "commercial" as const,
    title: page.title,
    description: page.meta_description,
    h1: page.h1,
    introduction: page.introduction,
    localInsights: page.local_insights,
    keywords: [],
    sections,
    faq,
    indexable: false,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = await getPage(await params);
  if (!page) return {};
  const content = pageContent(page);
  const canonical = page.canonical_url || `${appUrl}${page.route_path}`;
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical },
    robots: { index: content.indexable, follow: true },
    openGraph: {
      title: content.title,
      description: content.description,
      url: canonical,
      type: "website",
      siteName: "Sajivo",
    },
  };
}

const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export default async function LocalServicePage({ params }: { params: Promise<Params> }) {
  const page = await getPage(await params);
  if (!page) notFound();

  const content = pageContent(page);
  const relatedPages = content.indexable ? await getRelatedPages(page) : [];
  const canonical = page.canonical_url || `${appUrl}${page.route_path}`;
  const isGuide = content.intent === "informational";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": isGuide ? "Article" : "Service",
        name: content.serviceName,
        headline: isGuide ? content.h1 : undefined,
        areaServed: { "@type": "City", name: page.city_name },
        provider: isGuide ? undefined : { "@type": "Organization", name: "Sajivo", url: appUrl },
        publisher: isGuide ? { "@type": "Organization", name: "Sajivo", url: appUrl } : undefined,
        description: content.description,
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
          { "@type": "ListItem", position: 2, name: page.state_name, item: `${appUrl}/in/${page.state_slug}` },
          { "@type": "ListItem", position: 3, name: page.city_name, item: `${appUrl}/in/${page.state_slug}/${page.city_slug}` },
          { "@type": "ListItem", position: 4, name: content.serviceName, item: canonical },
        ],
      },
      ...(content.faq.length
        ? [{
            "@type": "FAQPage",
            mainEntity: content.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }]
        : []),
    ],
  };

  return (
    <main className="bg-[#f5f7f5] text-[#1d2824]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />

      <section className="relative min-h-[580px] overflow-hidden bg-[#15201c] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,15,.96),rgba(11,18,15,.68),rgba(11,18,15,.32)),url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center" />
        <div className="relative mx-auto flex min-h-[580px] max-w-7xl flex-col justify-center px-5 py-16 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-white/75">
            <MapPin size={15} />
            {page.city_name}, {page.state_name}
          </div>
          <h1 className="mt-6 max-w-4xl break-words text-4xl font-extrabold leading-[1.12] sm:text-5xl lg:text-6xl">{content.h1}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/80 sm:text-lg">{content.introduction}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/v2/register?city=${page.city_slug}&service=${content.slug}`} className="flex h-12 items-center gap-2 rounded-md bg-[#d65f45] px-5 text-sm font-bold shadow-[0_4px_0_#913624]">
              Plan your project <ArrowRight size={17} />
            </Link>
            <Link href={`/professionals?city=${page.city_slug}&service=${content.slug}`} className="flex h-12 items-center gap-2 rounded-md border border-white/35 bg-white/10 px-5 text-sm font-bold backdrop-blur">
              Explore professionals
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-white/75">
            <span className="flex items-center gap-2"><FileSearch size={16} />Comparable scope</span>
            <span className="flex items-center gap-2"><ClipboardCheck size={16} />Structured proposals</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} />Traceable decisions</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c94f37]">Local planning context</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight">Make the project easier to compare before you commit</h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#66716c]">{content.localInsights}</p>
          </div>
          <aside className="rounded-md border border-[#ccd7d0] bg-[#eaf2ed] p-6">
            <BadgeCheck size={22} className="text-[#39614e]" />
            <h2 className="mt-4 text-lg font-extrabold">A practical decision aid</h2>
            <p className="mt-3 text-sm leading-6 text-[#5e6d65]">Use this guide to prepare questions and compare project-specific evidence. Availability, pricing and fit still require current proposals and your own due diligence.</p>
          </aside>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {content.sections.map((section, index) => (
            <article key={section.heading} className="rounded-md border border-[#dce2dd] bg-white p-6">
              <span className="text-xs font-extrabold text-[#c94f37]">0{index + 1}</span>
              <h2 className="mt-3 break-words text-xl font-extrabold leading-snug">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-[#68736d]">{section.body}</p>
              <ul className="mt-5 space-y-3">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-6 text-[#394640]">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-[#d65f45]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {content.faq.length > 0 && (
        <section className="border-y border-[#dfe4e0] bg-white">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-18">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c94f37]">Frequently asked</p>
            <h2 className="mt-3 text-center text-3xl font-extrabold">Answers for planning in {page.city_name}</h2>
            <div className="mt-9 divide-y divide-[#e3e7e4] border-y border-[#e3e7e4]">
              {content.faq.map((item) => (
                <article key={item.question} className="py-6">
                  <h3 className="break-words text-base font-extrabold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#68736d]">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedPages.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <h2 className="text-2xl font-extrabold">Related project guides in {page.city_name}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPages.map((related) => {
              const relatedContent = buildProgrammaticSeoContent(related.service_slug, page.city_name, page.state_name);
              return (
                <Link key={related.route_path} href={related.route_path} className="group rounded-md border border-[#dce2dd] bg-white p-5">
                  <span className="text-sm font-extrabold leading-6">{relatedContent?.serviceName ?? related.service_name}</span>
                  <span className="mt-4 flex items-center gap-2 text-xs font-bold text-[#bd4d37]">Read guide <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
