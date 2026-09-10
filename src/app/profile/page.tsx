import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Fprofile");
  const { data: profile } = await supabase.from("profiles").select("primary_role").eq("id", auth.user.id).maybeSingle();
  if (profile?.primary_role === "designer" || profile?.primary_role === "contractor") redirect("/v2/professional/settings");
  if (profile?.primary_role === "vendor") redirect("/vendor/dashboard");
  redirect("/v2/client/profile");
}
