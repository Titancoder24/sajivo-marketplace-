import { NextResponse } from "next/server";
import { getPlatformAdmin } from "@/lib/server/angel";

export async function GET(request: Request) {
  const auth = await getPlatformAdmin("analyst");
  if (!auth) return NextResponse.json({ error: "Analytics-admin access required" }, { status: 403 });
  const path = new URL(request.url).searchParams.get("path");
  const [{ data: summary, error }, { data: heatmap, error: heatmapError }] = await Promise.all([
    auth.supabase.rpc("admin_analytics_summary"),
    auth.supabase.rpc("admin_heatmap_summary", { target_path: path || null }),
  ]);
  if (error || heatmapError) return NextResponse.json({ error: error?.message ?? heatmapError?.message }, { status: 400 });
  return NextResponse.json({ summary, heatmap });
}
