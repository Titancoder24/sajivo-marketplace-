import { SubscriptionScreen } from "./SubscriptionScreen";
import type { SubscriptionRole, SubscriptionSection } from "./subscription-data";

function parseRole(value?: string): SubscriptionRole {
  return value === "customer" || value === "vendor" || value === "professional" ? value : "professional";
}

export async function SubscriptionRoute({ section, searchParams }: { section: SubscriptionSection; searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  return <SubscriptionScreen initialRole={parseRole(params.role)} section={section} />;
}
