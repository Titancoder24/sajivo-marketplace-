import { SubscriptionRoute } from "@/components/v2/subscriptions/SubscriptionRoute";
export default function PlansPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) { return <SubscriptionRoute section="plans" searchParams={searchParams} />; }
