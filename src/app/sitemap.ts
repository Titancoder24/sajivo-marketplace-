import type { MetadataRoute } from "next";
import { PROGRAMMATIC_SEO_SLUGS } from "@/lib/seo/programmatic";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app").replace(/\/$/, "");
  const core: MetadataRoute.Sitemap = ["", "/professionals", "/services", "/how-it-works", "/for-professionals", "/seo-directory"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path ? 0.8 : 1 }));
  const supabase = await createClient();
  if (!supabase) return core;
  const managed: MetadataRoute.Sitemap = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("seo_pages")
      .select("route_path, updated_at")
      .eq("status", "published")
      .eq("indexing_allowed", true)
      .in("service_slug", PROGRAMMATIC_SEO_SLUGS)
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new Error("Published SEO sitemap could not be loaded.");
    managed.push(...(data ?? []).map((page) => ({ url: `${base}${page.route_path}`, lastModified: page.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })));
    if (!data || data.length < 500) break;
  }
  return Array.from(new Map([...core, ...managed].map((entry) => [entry.url, entry])).values());
}
