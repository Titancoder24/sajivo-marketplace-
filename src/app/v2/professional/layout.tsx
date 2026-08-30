import { ProfessionalShell } from "@/components/v2/professional/ProfessionalShell";
import { requireDashboardRoles } from "@/lib/server/auth";

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  await requireDashboardRoles(["designer", "contractor"]);
  return <ProfessionalShell>{children}</ProfessionalShell>;
}
