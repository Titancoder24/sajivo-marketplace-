import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildProgrammaticSeoContent,
  PROGRAMMATIC_SEO_TEMPLATES,
  toSeoSlug,
} from "@/lib/seo/programmatic";
import { getPlatformAdmin } from "@/lib/server/angel";

const schema = z.object({
  stateName: z.string().trim().min(2).max(100),
  cityName: z.string().trim().min(2).max(100),
  serviceName: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function GET() {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const [{ data: pages, error }, { count: keywordCount }] = await Promise.all([
    auth.supabase
      .from("seo_pages")
      .select("id, state_name, city_name, service_name, route_path, title, status, target_keywords, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500),
    auth.supabase.from("seo_keyword_targets").select("id", { count: "exact", head: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    pages: pages ?? [],
    keywordCount: keywordCount ?? 0,
    templates: PROGRAMMATIC_SEO_TEMPLATES,
  });
}

export async function POST(request: Request) {
  const auth = await getPlatformAdmin("super_admin");
  if (!auth) return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
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
