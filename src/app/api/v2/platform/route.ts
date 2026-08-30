import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lifecycleStages, platformModules, stakeholderGroups } from "@/lib/v2/architecture";

export async function GET() {
  const supabase = await createClient();
  const counts: Record<string, number | null> = {};

  if (supabase) {
    const tableNames = ["profiles", "projects", "proposals", "services", "vendor_products"] as const;
    const results = await Promise.all(tableNames.map((table) => supabase.from(table).select("id", { count: "exact", head: true })));
    tableNames.forEach((table, index) => {
      counts[table] = results[index].error ? null : (results[index].count ?? 0);
    });
  }

  return NextResponse.json({
    version: "1.0",
    product: "Unified Marketplace + Business OS + SAIOS",
    stakeholders: stakeholderGroups.map(({ name, roles }) => ({ name, roles })),
    modules: platformModules.map(({ name, description }) => ({ name, description })),
    lifecycle: lifecycleStages.map(([number, name, description]) => ({ number, name, description })),
    connectedDatabase: Boolean(supabase),
    counts,
  });
}
