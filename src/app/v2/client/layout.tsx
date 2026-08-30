import type { Metadata } from "next";
import { ClientShell } from "@/components/v2/client/ClientShell";
import { requireDashboardRole } from "@/lib/server/auth";

export const metadata:Metadata={title:"Client workspace | Sajivo",description:"Manage interior projects, proposals, payments and conversations."};
export default async function Layout({children}:{children:React.ReactNode}){await requireDashboardRole("customer");return <ClientShell>{children}</ClientShell>}
