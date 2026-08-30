import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformAdmin } from "@/lib/server/angel";

const schema = z.object({ stateName: z.string().trim().min(2).max(100), cityName: z.string().trim().min(2).max(100), serviceName: z.string().trim().min(2).max(120), status: z.enum(["draft", "published"]).default("draft") });
const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

export async function GET() {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const [{ data: pages, error }, { count: keywordCount }] = await Promise.all([
    auth.supabase.from("seo_pages").select("id, state_name, city_name, service_name, route_path, title, status, target_keywords, published_at, updated_at").order("updated_at", { ascending: false }).limit(500),
    auth.supabase.from("seo_keyword_targets").select("id", { count: "exact", head: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pages: pages ?? [], keywordCount: keywordCount ?? 0 });
}

export async function POST(request: Request) {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "State, city, and service are required." }, { status: 400 });
  const { stateName, cityName, serviceName, status } = parsed.data;
  const stateSlug = slug(stateName), citySlug = slug(cityName), serviceSlug = slug(serviceName);
  const routePath = `/in/${stateSlug}/${citySlug}/${serviceSlug}`;
  const keywords = [`${serviceName.toLowerCase()} in ${cityName.toLowerCase()}`, `best ${serviceName.toLowerCase()} ${cityName.toLowerCase()}`, `verified ${serviceName.toLowerCase()} near me`, `${cityName.toLowerCase()} ${serviceName.toLowerCase()} cost`];
  const { data: page, error } = await auth.supabase.from("seo_pages").upsert({ state_slug: stateSlug, state_name: stateName, city_slug: citySlug, city_name: cityName, service_slug: serviceSlug, service_name: serviceName, route_path: routePath, title: `${serviceName} in ${cityName} | Sajivo`, meta_description: `Discover verified ${serviceName.toLowerCase()} in ${cityName}. Compare structured proposals, project experience and service fit on Sajivo.`, h1: `${serviceName} in ${cityName}`, introduction: "Plan your project with verified professionals, structured requirements and comparable proposals through Sajivo.", local_insights: `Sajivo helps customers in ${cityName}, ${stateName} discover professionals based on project type, location, budget, availability and verified marketplace information.`, faq: [{ question: `How do I find verified professionals in ${cityName}?`, answer: "Create a Sajivo requirement with your location, scope, budget and timeline. Eligible professionals can then respond with structured proposals." }, { question: "Can I compare proposals?", answer: "Yes. Sajivo keeps proposals, timelines, terms and project communication together for easier comparison." }], target_keywords: keywords, status, published_at: status === "published" ? new Date().toISOString() : null, created_by: auth.userId, updated_at: new Date().toISOString() }, { onConflict: "state_slug,city_slug,service_slug" }).select("id, route_path, title, status, target_keywords").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auth.supabase.from("seo_keyword_targets").upsert(keywords.map((keyword) => ({ page_id: page.id, keyword, intent: keyword.includes("near me") ? "local" : "commercial", priority: 70 })), { onConflict: "page_id,keyword" });
  return NextResponse.json({ page }, { status: 201 });
}
