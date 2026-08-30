import { SubscriptionRoute } from "@/components/v2/subscriptions/SubscriptionRoute";
export default function CreditsPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) { return <SubscriptionRoute section="credits" searchParams={searchParams} />; }
