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
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data } = await supabase.from("profiles").select("full_name,primary_role").eq("id", auth.user.id).maybeSingle();
      profile = data;
    }
  }
  return <V2Shell initialProfile={profile}>{children}</V2Shell>;
}
