import { getActiveUser } from "@/lib/supabase/account-access";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/sajivo/DashboardBlocks";
import { RateAdminPanel } from "@/features/estimates/RateAdminPanel";
import { createClient } from "@/lib/supabase/server";

export default async function EstimationRatesPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("primary_role").eq("id", authData.user.id).single();
  if (profile?.primary_role !== "admin") redirect("/dashboard");
  return <><DashboardHeader eyebrow="Administration" title="Estimation rates" text="Maintain the location, quality, material, contingency, and tax inputs behind Sajivo’s range engine." /><RateAdminPanel /></>;
}
