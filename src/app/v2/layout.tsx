import type { Metadata } from "next";
import { V2Shell } from "@/components/v2/V2Shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sajivo v2 | Marketplace + Business OS + SAIOS",
  description: "The unified Sajivo marketplace, business operating system and AI operating system.",
};

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  let profile: { full_name?: string; primary_role?: string } | null = null;
  let isPlatformAdmin = false;
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const [{ data }, { data: admin }] = await Promise.all([
        supabase.from("profiles").select("full_name,primary_role").eq("id", auth.user.id).maybeSingle(),
        supabase.from("platform_admins").select("profile_id").eq("profile_id", auth.user.id).eq("status", "active").maybeSingle(),
      ]);
      profile = data;
      isPlatformAdmin = Boolean(admin);
    }
  }
  return <V2Shell initialProfile={profile} isPlatformAdmin={isPlatformAdmin}>{children}</V2Shell>;
}
