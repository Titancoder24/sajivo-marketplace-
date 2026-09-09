import type { Metadata } from "next";
import Link from "next/link";
import {
  APPROVED_SEO_CITIES,
  HIGH_INTENT_SEO_ROUTES,
} from "@/lib/seo/programmatic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sajivo-app.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Interior Design, Renovation & Construction Guides | Sajivo",
  description:
    "Browse Sajivo's location-specific interior design, renovation, contractor, cost and project-management guides for approved Indian cities.",
  alternates: { canonical: `${siteUrl}/seo-directory` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sajivo project planning and professional discovery guides",
    description:
      "Find locally relevant planning guides for interior design, renovation, construction and project delivery.",
    url: `${siteUrl}/seo-directory`,
    type: "website",
  },
};

type UnknownRecord = Record<string, unknown>;

type SeoRoute = {
  keyword: string;
  slug: string;
};

type SeoCity = {
  name: string;
  slug: string;
  stateName: string;
  stateSlug: string;
};

const record = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const textValue = (source: UnknownRecord, keys: string[], fallback: string) => {
  for (const key of keys) {
    if (typeof source[key] === "string" && source[key]) return source[key] as string;
  }
  return fallback;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const seoRoutes: SeoRoute[] = (HIGH_INTENT_SEO_ROUTES as readonly unknown[]).map(
  (item, index) => {
    const source = record(item);
    const keyword =
      typeof item === "string"
        ? item
        : textValue(source, ["keyword", "phrase", "query", "title", "label"], `SEO guide ${index + 1}`);
    const rawSlug = textValue(
      source,
      ["slug", "routeSlug", "canonicalSlug", "templateSlug"],
      slugify(keyword),
    );
    return { keyword, slug: rawSlug.replace(/^\/+|\/+$/g, "") };
  },
);

const canonicalRoutes = Array.from(
  new Map(seoRoutes.map((route) => [route.slug, route])).values(),
);

const seoCities: SeoCity[] = (APPROVED_SEO_CITIES as readonly unknown[]).map(
  (item) => {
    const source = record(item);
    const name = typeof item === "string" ? item : textValue(source, ["name", "city", "label"], "Lucknow");
    const stateName = textValue(source, ["stateName", "state"], "Uttar Pradesh");
    return {
      name,
      slug: textValue(source, ["slug", "citySlug"], slugify(name)),
      stateName,
      stateSlug: textValue(source, ["stateSlug"], slugify(stateName)),
    };
  },
);

const orderedCities = [...seoCities].sort((a, b) => {
  if (a.slug === "lucknow") return -1;
  if (b.slug === "lucknow") return 1;
  return a.name.localeCompare(b.name);
});

const routeFor = (city: SeoCity, route: SeoRoute) =>
  `/in/${city.stateSlug}/${city.slug}/${route.slug}`;

export default function SeoDirectoryPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-black/10 bg-[var(--background)] px-5 py-14 dark:border-white/10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase text-[#d85f42]">Sajivo resource directory</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold sm:text-5xl">
            Local project planning and professional discovery guides
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 opacity-75">
            Browse useful, location-specific pages for interior design, renovation,
            contractor selection, cost planning and project management. These pages
            are structured for people and search engines; search visibility and
            ranking remain subject to each search engine&apos;s evaluation.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <nav aria-label="Browse guides by city" className="border-b border-black/10 pb-8 dark:border-white/10">
          <h2 className="text-xl font-semibold">Browse by city</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {orderedCities.map((city) => (
              <a
                key={`${city.stateSlug}-${city.slug}`}
                href={`#${city.slug}`}
                className="text-sm font-medium text-[#b94730] underline-offset-4 hover:underline"
              >
                {city.name}
              </a>
            ))}
          </div>
        </nav>

        {orderedCities[0] && (
          <section className="border-b border-black/10 py-10 dark:border-white/10" aria-labelledby="keyword-map-heading">
            <h2 id="keyword-map-heading" className="text-2xl font-semibold">High-intent keyword map</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-65">
              All 25 supplied searches map to {canonicalRoutes.length} substantial intent guides. Closely related phrases share a canonical page instead of creating thin duplicate content.
            </p>
            <ol className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {seoRoutes.map((route) => (
                <li key={`${route.slug}-${route.keyword}`}>
                  <Link href={routeFor(orderedCities[0], route)} className="text-[15px] font-medium leading-6 text-[#b94730] underline-offset-4 hover:underline">
                    {route.keyword}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="divide-y divide-black/10 dark:divide-white/10">
          {orderedCities.map((city) => (
            <section
              id={city.slug}
              key={`${city.stateSlug}-${city.slug}`}
              aria-labelledby={`${city.slug}-heading`}
              className="scroll-mt-6 py-10"
            >
              <h2 id={`${city.slug}-heading`} className="text-2xl font-semibold">
                Guides for {city.name}, {city.stateName}
              </h2>
              <p className="mt-2 text-sm opacity-65">
                {canonicalRoutes.length} canonical local guides covering the approved high-intent phrases.
              </p>
              <ol className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                {canonicalRoutes.map((route) => {
                  const href = routeFor(city, route);
                  return (
                    <li key={`${city.slug}-${route.slug}-${route.keyword}`}>
                      <Link
                        href={href}
                        className="inline-flex text-[15px] font-medium leading-6 text-[#b94730] underline-offset-4 hover:underline"
                      >
                        {route.keyword} in {city.name}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
