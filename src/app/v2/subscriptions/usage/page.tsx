import { SubscriptionRoute } from "@/components/v2/subscriptions/SubscriptionRoute";
export default function UsagePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) { return <SubscriptionRoute section="usage" searchParams={searchParams} />; }
