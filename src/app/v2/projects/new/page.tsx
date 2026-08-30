import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const roleHome: Record<string, string> = {
  designer: "/v2/professional",
  contractor: "/v2/professional",
  vendor: "/vendor/dashboard",
  admin: "/v2/admin",
};

export default async function StartProjectBriefPage() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured for this deployment.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Fv2%2Fprojects%2Fnew");
  const { data: profile } = await supabase.from("profiles").select("primary_role").eq("id", auth.user.id).maybeSingle();
  if (profile?.primary_role && profile.primary_role !== "customer") redirect(roleHome[profile.primary_role] ?? "/v2");
  redirect("/customer/dashboard/projects/new");
}
