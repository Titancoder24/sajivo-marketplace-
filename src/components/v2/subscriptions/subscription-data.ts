import type { LucideIcon } from "lucide-react";
import { Bot, BriefcaseBusiness, Building2, FileCheck2, Image, PackageCheck, Send, Sparkles, Users } from "lucide-react";

export type SubscriptionRole = "customer" | "professional" | "vendor";
export type SubscriptionSection = "plans" | "credits" | "usage" | "billing";

export type Entitlement = { label: string; included: boolean; note?: string };
export type Plan = {
  name: string;
  description: string;
  price: string;
  cadence: string;
  entitlements: Entitlement[];
  popular?: boolean;
  current?: boolean;
};
export type UsageItem = {
  label: string;
  detail: string;
  used: number;
  limit: number;
  Icon: LucideIcon;
  color: string;
  soft: string;
};

export const roleMeta: Record<SubscriptionRole, { label: string; account: string; subtitle: string; initials: string }> = {
  customer: { label: "Customer", account: "Rahul Sharma", subtitle: "Homeowner", initials: "RS" },
  professional: { label: "Professional", account: "Rahul Interiors", subtitle: "Interior designer", initials: "RI" },
  vendor: { label: "Vendor", account: "Studio Supply Co.", subtitle: "Verified vendor", initials: "SS" },
};

export const plansByRole: Record<SubscriptionRole, Plan[]> = {
  customer: [
    { name: "Free", description: "For planning your first project", price: "₹0", cadence: "Free forever", entitlements: [{ label: "1 active project", included: true }, { label: "3 AI design credits", included: true }, { label: "Standard professional matching", included: true }, { label: "Priority support", included: false }] },
    { name: "Plus", description: "For active home renovation", price: "₹799", cadence: "Billed monthly", current: true, popular: true, entitlements: [{ label: "3 active projects", included: true }, { label: "50 AI design credits", included: true }, { label: "Priority professional matching", included: true }, { label: "Budget tracking", included: true }, { label: "Priority support", included: true }] },
    { name: "Premium", description: "For complex, multi-room projects", price: "₹1,999", cadence: "Billed monthly", entitlements: [{ label: "Unlimited active projects", included: true }, { label: "200 AI design credits", included: true }, { label: "Dedicated project advisor", included: true }, { label: "Document review", included: true }, { label: "Payment protection", included: true }] },
    { name: "Concierge", description: "For end-to-end project support", price: "Custom", cadence: "Talk to our team", entitlements: [{ label: "Unlimited projects", included: true }, { label: "Unlimited AI credits", included: true }, { label: "Dedicated concierge", included: true }, { label: "On-site coordination", included: true }, { label: "Custom reporting", included: true }] },
  ],
  professional: [
    { name: "Starter", description: "For new professionals", price: "₹499", cadence: "Billed monthly", entitlements: [{ label: "3 daily proposal credits", included: true }, { label: "Basic profile visibility", included: true }, { label: "5 portfolio projects", included: true }, { label: "Basic analytics", included: true }, { label: "Verified badge", included: false }] },
    { name: "Pro", description: "For growing professionals", price: "₹1,499", cadence: "Billed monthly", current: true, popular: true, entitlements: [{ label: "10 daily proposal credits", included: true }, { label: "Priority in search results", included: true }, { label: "Unlimited portfolio", included: true }, { label: "Advanced analytics", included: true }, { label: "Verified badge", included: true }] },
    { name: "Business", description: "For teams and established studios", price: "₹3,999", cadence: "Billed monthly", entitlements: [{ label: "20 daily proposal credits", included: true }, { label: "Featured profile", included: true }, { label: "5 team members", included: true }, { label: "Competitor insights", included: true }, { label: "Lead insights", included: true }] },
    { name: "Enterprise", description: "For large businesses and agencies", price: "Custom", cadence: "Contact for pricing", entitlements: [{ label: "Unlimited proposal credits", included: true }, { label: "Dedicated account manager", included: true }, { label: "Custom integrations", included: true }, { label: "Advanced permissions", included: true }, { label: "24/7 premium support", included: true }] },
  ],
  vendor: [
    { name: "Starter", description: "For independent sellers", price: "₹699", cadence: "Billed monthly", entitlements: [{ label: "25 catalogue products", included: true }, { label: "5 monthly enquiry credits", included: true }, { label: "Standard listing visibility", included: true }, { label: "Team access", included: false }] },
    { name: "Growth", description: "For growing product businesses", price: "₹1,799", cadence: "Billed monthly", current: true, popular: true, entitlements: [{ label: "150 catalogue products", included: true }, { label: "30 monthly enquiry credits", included: true }, { label: "Priority search placement", included: true }, { label: "2 team members", included: true }, { label: "Sales analytics", included: true }] },
    { name: "Business", description: "For established suppliers", price: "₹4,499", cadence: "Billed monthly", entitlements: [{ label: "Unlimited catalogue", included: true }, { label: "100 monthly enquiry credits", included: true }, { label: "Featured collections", included: true }, { label: "8 team members", included: true }, { label: "Lead insights", included: true }] },
    { name: "Enterprise", description: "For brands and distributors", price: "Custom", cadence: "Contact for pricing", entitlements: [{ label: "Unlimited enquiries", included: true }, { label: "Dedicated account manager", included: true }, { label: "ERP integrations", included: true }, { label: "Custom permissions", included: true }, { label: "24/7 premium support", included: true }] },
  ],
};

export const usageByRole: Record<SubscriptionRole, UsageItem[]> = {
  customer: [
    { label: "AI Design Credits", detail: "36 / 50 used", used: 36, limit: 50, Icon: Sparkles, color: "#f2540b", soft: "#fff1e9" },
    { label: "Active Projects", detail: "2 / 3 active", used: 2, limit: 3, Icon: BriefcaseBusiness, color: "#07875f", soft: "#e8f7f1" },
    { label: "Expert Reviews", detail: "1 / 2 this cycle", used: 1, limit: 2, Icon: FileCheck2, color: "#6d45c6", soft: "#f1ecfb" },
    { label: "Storage", detail: "4.2 / 10 GB", used: 4.2, limit: 10, Icon: Image, color: "#287bd8", soft: "#eaf3fc" },
  ],
  professional: [
    { label: "Daily Proposal Credits", detail: "7 / 10 used today", used: 7, limit: 10, Icon: Send, color: "#f2540b", soft: "#fff1e9" },
    { label: "AI Credits", detail: "1,240 / 1,500 used", used: 1240, limit: 1500, Icon: Bot, color: "#07875f", soft: "#e8f7f1" },
    { label: "Featured Listings", detail: "1 / 5 active", used: 1, limit: 5, Icon: Sparkles, color: "#6d45c6", soft: "#f1ecfb" },
    { label: "Team Members", detail: "2 / 5 active", used: 2, limit: 5, Icon: Users, color: "#287bd8", soft: "#eaf3fc" },
  ],
  vendor: [
    { label: "Enquiry Credits", detail: "18 / 30 used", used: 18, limit: 30, Icon: Send, color: "#f2540b", soft: "#fff1e9" },
    { label: "Catalogue Products", detail: "94 / 150 published", used: 94, limit: 150, Icon: PackageCheck, color: "#07875f", soft: "#e8f7f1" },
    { label: "Featured Collections", detail: "2 / 5 active", used: 2, limit: 5, Icon: Sparkles, color: "#6d45c6", soft: "#f1ecfb" },
    { label: "Team Members", detail: "2 / 2 active", used: 2, limit: 2, Icon: Users, color: "#287bd8", soft: "#eaf3fc" },
  ],
};

export const currentPlanName: Record<SubscriptionRole, string> = { customer: "Plus", professional: "Pro", vendor: "Growth" };
export const currentPlanPrice: Record<SubscriptionRole, string> = { customer: "₹799", professional: "₹1,499", vendor: "₹1,799" };
export const roleIcon: Record<SubscriptionRole, LucideIcon> = { customer: BriefcaseBusiness, professional: Building2, vendor: PackageCheck };
