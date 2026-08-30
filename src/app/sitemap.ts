import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app";
  const core: MetadataRoute.Sitemap = ["", "/professionals", "/services", "/how-it-works", "/for-professionals"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path ? 0.8 : 1 }));
  const supabase = await createClient();
  if (!supabase) return core;
  const { data } = await supabase.from("seo_pages").select("route_path, updated_at").eq("status", "published").limit(5000);
  return [...core, ...(data ?? []).map((page) => ({ url: `${base}${page.route_path}`, lastModified: page.updated_at, changeFrequency: "weekly" as const, priority: 0.7 }))];
}
