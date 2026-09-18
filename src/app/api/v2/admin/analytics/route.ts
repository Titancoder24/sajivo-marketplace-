import { NextResponse } from "next/server";
import { getPlatformAdmin } from "@/lib/server/angel";
import { analyticsHeatmapSchema, analyticsSummarySchema } from "@/lib/analytics/schema";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const auth = await getPlatformAdmin("analyst");
    if (!auth) return NextResponse.json({ error: "Analytics-admin access required" }, { status: 403, headers });
    const path = new URL(request.url).searchParams.get("path");
    const [{ data: summary, error }, { data: heatmap, error: heatmapError }] = await Promise.all([
      auth.supabase.rpc("admin_analytics_summary"),
      auth.supabase.rpc("admin_heatmap_summary", { target_path: path || null }),
    ]);
    if (error || heatmapError) return NextResponse.json({ error: "Analytics could not be loaded from Supabase. Please retry." }, { status: 503, headers });
    const parsedSummary = analyticsSummarySchema.safeParse(summary);
    const parsedHeatmap = analyticsHeatmapSchema.safeParse(heatmap);
    if (!parsedSummary.success || !parsedHeatmap.success) {
      return NextResponse.json({ error: "Supabase returned incomplete analytics. Check the analytics database migrations." }, { status: 502, headers });
    }
    return NextResponse.json({ summary: parsedSummary.data, heatmap: parsedHeatmap.data }, { headers });
  } catch {
    return NextResponse.json({ error: "Analytics is temporarily unavailable. Please retry." }, { status: 503, headers });
  }
}
