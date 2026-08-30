import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SuperAdminConsole } from "@/components/v2/admin/SuperAdminConsole";
import { getPlatformAdmin } from "@/lib/server/angel";

export const metadata: Metadata = { title: "Sajivo Super Admin", robots: { index: false, follow: false } };

export default async function SuperAdminPage() {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/v2");
  return <SuperAdminConsole />;
}
