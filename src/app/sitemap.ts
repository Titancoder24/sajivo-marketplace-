import type { MetadataRoute } from "next";
import { APPROVED_SEO_CITIES, PROGRAMMATIC_SEO_SLUGS } from "@/lib/seo/programmatic";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app").replace(/\/$/, "");
  const core: MetadataRoute.Sitemap = ["", "/professionals", "/services", "/how-it-works", "/for-professionals", "/seo-directory"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path ? 0.8 : 1 }));
  const approved: MetadataRoute.Sitemap = APPROVED_SEO_CITIES.flatMap((location) =>
    PROGRAMMATIC_SEO_SLUGS.map((serviceSlug) => ({
      url: `${base}/in/${location.stateSlug}/${location.citySlug}/${serviceSlug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );
  const supabase = await createClient();
  if (!supabase) return [...core, ...approved];
  const { data } = await supabase
    .from("seo_pages")
    .select("route_path, updated_at")
    .eq("status", "published")
    .eq("indexing_allowed", true)
    .in("service_slug", PROGRAMMATIC_SEO_SLUGS)
    .limit(5000);
  const managed = (data ?? []).map((page) => ({ url: `${base}${page.route_path}`, lastModified: page.updated_at, changeFrequency: "weekly" as const, priority: 0.7 }));
  return Array.from(new Map([...core, ...approved, ...managed].map((entry) => [entry.url, entry])).values());
}
