import { NextResponse } from "next/server";
import { z } from "zod";
import {
  APPROVED_SEO_CITIES,
  buildProgrammaticSeoContent,
  HIGH_INTENT_SEO_ROUTES,
  PROGRAMMATIC_SEO_TEMPLATES,
  toSeoSlug,
} from "@/lib/seo/programmatic";
import { getPlatformAdmin } from "@/lib/server/angel";

const singleSchema = z.object({
  mode: z.literal("single").optional(),
  stateName: z.string().trim().min(2).max(100),
  cityName: z.string().trim().min(2).max(100),
  serviceName: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published"]).default("draft"),
});

const bulkSchema = z.object({
  mode: z.literal("bulk"),
  locations: z.array(z.object({ stateName: z.string().trim().min(2).max(100), cityName: z.string().trim().min(2).max(100) })).min(1).max(500),
  serviceSlugs: z.array(z.string().trim().min(2).max(120)).min(1).max(50),
  limit: z.number().int().min(1).max(2000),
});

export async function GET() {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const [{ data: pages, error }, { count: keywordCount }, { data: jobs }] = await Promise.all([
    auth.supabase
      .from("seo_pages")
      .select("id, state_name, city_name, service_name, route_path, title, status, quality_status, indexing_allowed, target_keywords, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500),
    auth.supabase.from("seo_keyword_targets").select("id", { count: "exact", head: true }),
    auth.supabase.from("seo_generation_jobs").select("id,requested_count,generated_count,status,created_at,completed_at").order("created_at", { ascending: false }).limit(8),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    pages: pages ?? [],
    keywordCount: keywordCount ?? 0,
    templates: PROGRAMMATIC_SEO_TEMPLATES,
    highIntentRoutes: HIGH_INTENT_SEO_ROUTES.map((route) => ({
      ...route,
      crawlStatus: "Crawlable",
      indexable: true,
    })),
    approvedCities: APPROVED_SEO_CITIES.map((location) => ({
      name: location.city,
      slug: location.citySlug,
      stateName: location.state,
      stateSlug: location.stateSlug,
    })),
    jobs: jobs ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.mode === "bulk") return createBulkPages(auth, body);
  const parsed = singleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "State, city, and service are required." }, { status: 400 });

  const { stateName, cityName, serviceName, status } = parsed.data;
  const content = buildProgrammaticSeoContent(toSeoSlug(serviceName), cityName, stateName);
  if (!content) {
    return NextResponse.json(
      {
        error: "Choose a supported SEO intent. Arbitrary templates are disabled to prevent thin pages.",
        templates: PROGRAMMATIC_SEO_TEMPLATES,
      },
      { status: 400 },
    );
  }

  const stateSlug = toSeoSlug(stateName);
  const citySlug = toSeoSlug(cityName);
  const serviceSlug = content.slug;
  const routePath = `/in/${stateSlug}/${citySlug}/${serviceSlug}`;
  const timestamp = new Date().toISOString();
  const { data: page, error } = await auth.supabase
    .from("seo_pages")
    .upsert(
      {
        state_slug: stateSlug,
        state_name: stateName,
        city_slug: citySlug,
        city_name: cityName,
        service_slug: serviceSlug,
        service_name: content.serviceName,
        route_path: routePath,
        title: content.title,
        meta_description: content.description,
        h1: content.h1,
        introduction: content.introduction,
        local_insights: content.localInsights,
        faq: content.faq,
        target_keywords: content.keywords,
        status,
        quality_status: status === "published" ? "approved" : "needs_review",
        indexing_allowed: status === "published",
        answer_summary: content.introduction,
        entity_data: { service: content.serviceName, city: cityName, state: stateName, intent: content.intent },
        published_at: status === "published" ? timestamp : null,
        created_by: auth.userId,
        updated_at: timestamp,
      },
      { onConflict: "state_slug,city_slug,service_slug" },
    )
    .select("id, route_path, title, status, target_keywords")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: keywordError } = await auth.supabase.from("seo_keyword_targets").upsert(
    content.keywords.map((keyword, index) => ({
      page_id: page.id,
      keyword,
      intent: keyword.includes("near me") ? "local" : content.intent,
      priority: Math.max(70, 90 - index * 5),
    })),
    { onConflict: "page_id,keyword" },
  );
  if (keywordError) {
    return NextResponse.json(
      { error: `Page saved, but keyword targets could not be updated: ${keywordError.message}`, page },
      { status: 500 },
    );
  }

  return NextResponse.json({ page }, { status: 201 });
}

async function createBulkPages(auth: NonNullable<Awaited<ReturnType<typeof getPlatformAdmin>>>, body: unknown) {
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose locations, supported templates, and a limit up to 2,000." }, { status: 400 });
  const combinations = parsed.data.locations.flatMap((location) => parsed.data.serviceSlugs.map((serviceSlug) => ({ ...location, serviceSlug }))).slice(0, parsed.data.limit);
  const rows = combinations.flatMap(({ stateName, cityName, serviceSlug }) => {
    const content = buildProgrammaticSeoContent(serviceSlug, cityName, stateName);
    if (!content) return [];
    const stateSlug = toSeoSlug(stateName), citySlug = toSeoSlug(cityName), routePath = `/in/${stateSlug}/${citySlug}/${content.slug}`;
    return [{ state_slug: stateSlug, state_name: stateName, city_slug: citySlug, city_name: cityName, service_slug: content.slug, service_name: content.serviceName, route_path: routePath, title: content.title, meta_description: content.description, h1: content.h1, introduction: content.introduction, local_insights: content.localInsights, faq: content.faq, target_keywords: content.keywords, status: "draft", quality_status: "needs_review", indexing_allowed: false, answer_summary: content.introduction, entity_data: { service: content.serviceName, city: cityName, state: stateName, intent: content.intent }, canonical_url: null, created_by: auth.userId, updated_at: new Date().toISOString() }];
  });
  if (!rows.length) return NextResponse.json({ error: "No supported page combinations were supplied." }, { status: 400 });
  const { data: job, error: jobError } = await auth.supabase.from("seo_generation_jobs").insert({ requested_by: auth.userId, requested_count: rows.length, configuration: { locations: parsed.data.locations.length, services: parsed.data.serviceSlugs, publication: "draft_only" } }).select("id").single();
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 400 });
  let generated = 0;
  try {
    for (let index = 0; index < rows.length; index += 200) {
      const { data: pages, error } = await auth.supabase.from("seo_pages").upsert(rows.slice(index, index + 200), { onConflict: "state_slug,city_slug,service_slug" }).select("id,target_keywords");
      if (error) throw error;
      generated += pages?.length ?? 0;
      const keywords = (pages ?? []).flatMap((page) => page.target_keywords.map((keyword: string, keywordIndex: number) => ({ page_id: page.id, keyword, intent: keyword.includes("near me") ? "local" : "commercial", priority: Math.max(70, 90 - keywordIndex * 5) })));
      if (keywords.length) { const { error: keywordError } = await auth.supabase.from("seo_keyword_targets").upsert(keywords, { onConflict: "page_id,keyword" }); if (keywordError) throw keywordError; }
    }
    await auth.supabase.from("seo_generation_jobs").update({ status: "completed", generated_count: generated, completed_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ jobId: job.id, generated, publication: "draft" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk generation failed";
    await auth.supabase.from("seo_generation_jobs").update({ status: "failed", generated_count: generated, error_message: message, completed_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ error: message, generated, jobId: job.id }, { status: 500 });
  }
}
