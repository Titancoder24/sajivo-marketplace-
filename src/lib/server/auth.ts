import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

const roleHome: Record<UserRole, string> = {
  customer: "/customer/dashboard",
  designer: "/designer/dashboard",
  contractor: "/contractor/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/customer/dashboard",
};

export async function requireDashboardRole(expectedRole: Exclude<UserRole, "admin">) {
  return requireDashboardRoles([expectedRole]);
}

export async function requireDashboardRoles(expectedRoles: Array<Exclude<UserRole, "admin">>) {
  const supabase = await createClient();
  const expectedRole = expectedRoles[0];
  if (!supabase) redirect("/login?status=configuration_error");
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    redirect(`/login?next=${encodeURIComponent(roleHome[expectedRole])}`);
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email, primary_role, account_status").eq("id", authData.user.id).single();
  if (!profile || (profile.account_status && profile.account_status !== "active")) redirect("/login?status=account_unavailable");
  const role = profile.primary_role as UserRole;
  if (!expectedRoles.includes(role as Exclude<UserRole, "admin">) && role !== "admin") redirect(roleHome[role] ?? "/dashboard");
  return { userId: authData.user.id, profile };
}
