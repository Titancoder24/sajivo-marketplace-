import {
  BadgeCheck,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  Landmark,
  MessagesSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Users,
  WalletCards,
} from "lucide-react";

export const platformModules = [
  { name: "Identity & accounts", description: "People, organizations, roles, permissions, verification and reputation.", icon: Users },
  { name: "Requirements & matching", description: "Structured briefs, SAIOS analysis, compatibility scoring and opportunity waves.", icon: Search },
  { name: "Project management", description: "Proposals, contracts, milestones, tasks, teams and project workspaces.", icon: BriefcaseBusiness },
  { name: "Catalog & taxonomy", description: "Spaces, elements, materials, finishes, brands, products and specifications.", icon: ShoppingBag },
  { name: "Communication", description: "Contextual chat, files, announcements and multi-channel notifications.", icon: MessagesSquare },
  { name: "Finance", description: "Invoices, payments, receipts, credits, refunds and GST/TCS records.", icon: Landmark },
  { name: "Subscriptions", description: "Role-aware plans, entitlements, usage limits, renewals and AI credits.", icon: WalletCards },
  { name: "SAIOS", description: "Assistants, recommendations, estimation, document generation and risk alerts.", icon: Bot },
  { name: "Trust & safety", description: "Verification, risk scoring, fraud prevention, disputes and immutable audit events.", icon: ShieldCheck },
  { name: "Documents", description: "Contracts, invoices, certificates, templates, versions and linked assets.", icon: FileText },
  { name: "Analytics", description: "Marketplace, conversion, project, finance, retention and predictive insights.", icon: BarChart3 },
  { name: "Organizations", description: "Owners, managers, project managers, engineers, supervisors, workers and accountants.", icon: Building2 },
] as const;

export const lifecycleStages = [
  ["01", "Discovery & onboarding", "Create identity, verify account, choose role and complete profile."],
  ["02", "Requirement creation", "Build a structured brief with budget, style, timeline, location and files."],
  ["03", "AI matching", "Score compatibility and allocate opportunities in controlled waves."],
  ["04", "Proposal & quotation", "Eligible professionals submit scope, portfolio, commercial terms and timeline."],
  ["05", "Selection & contract", "Compare offers, select a professional and execute the digital agreement."],
  ["06", "Project execution", "Coordinate milestones, tasks, teams, site evidence and SAIOS health scoring."],
  ["07", "Payments", "Approve milestones, issue invoices, confirm payment and create receipts."],
  ["08", "Handover", "Deliver completion records, certificates, warranties and final documentation."],
  ["09", "Review & growth", "Capture reputation, referrals, insights and learning for the next cycle."],
] as const;

export const stakeholderGroups = [
  { name: "Customers", roles: "Homeowners and businesses", icon: Users },
  { name: "Design", roles: "Interior designers and architects", icon: BadgeCheck },
  { name: "Execution", roles: "Contractors, workers and specialists", icon: Building2 },
  { name: "Commerce", roles: "Vendors, suppliers and brands", icon: ShoppingBag },
  { name: "SAJIVO", roles: "Admin, trust, finance and support", icon: Handshake },
] as const;
