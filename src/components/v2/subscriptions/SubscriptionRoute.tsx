import { getActiveUser } from "@/lib/supabase/account-access";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionScreen } from "./SubscriptionScreen";
import type { SubscriptionRole, SubscriptionSection } from "./subscription-data";

export async function SubscriptionRoute({ section }: { section: SubscriptionSection; searchParams: Promise<{ role?: string }> }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/v2/subscriptions");
  const { data: auth } = await getActiveUser(supabase);
  if (!auth.user) redirect("/login?next=/v2/subscriptions");
  const { data: profile } = await supabase.from("profiles").select("primary_role").eq("id", auth.user.id).single();
  const role: SubscriptionRole = profile?.primary_role === "customer" ? "customer" : profile?.primary_role === "vendor" ? "vendor" : "professional";
  return <SubscriptionScreen initialRole={role} section={section} />;
}
