import { getActiveUser } from "@/lib/supabase/account-access";
import { services } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, Proposal, UserRole } from "@/types/domain";

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    primaryRole: row.primary_role as UserRole,
    roles: (row.roles as UserRole[] | null) ?? [row.primary_role as UserRole],
    accountType: row.account_type as Profile["accountType"],
    businessAccountType: row.business_account_type as Profile["businessAccountType"],
    businessRole: row.business_role as Profile["businessRole"],
    city: row.city as string | undefined,
    state: row.state as string | undefined,
    bio: row.bio as string | undefined,
    businessName: row.business_name as string | undefined,
    yearsExperience: row.years_experience as number | undefined,
    serviceAreas: (row.service_areas as string[] | null) ?? [],
    services: (row.services as string[] | null) ?? [],
    specializations: (row.specializations as string[] | null) ?? [],
    startingPrice: row.starting_price as number | undefined,
    projectSizeRange: row.project_size_range as string | undefined,
    availabilityStatus: row.availability_status as string | undefined,
    verificationStatus: row.verification_status as Profile["verificationStatus"],
    ratingAvg: row.rating_avg as number | undefined,
    reviewsCount: row.reviews_count as number | undefined,
    profilePhotoUrl: row.profile_photo_url as string | undefined,
  };
}

function toProposal(row: Record<string, unknown>): Proposal {
  const professional = row.professional as Record<string, unknown> | null;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    customerId: String(row.customer_id),
    professionalId: String(row.professional_id),
    professionalRole: row.professional_role as UserRole,
    professionalName: String(professional?.full_name ?? "Sajivo professional"),
    status: row.status as Proposal["status"],
    proposedAmount: row.proposed_amount as number | undefined,
    proposedAmountMin: row.proposed_amount_min as number | undefined,
    proposedAmountMax: row.proposed_amount_max as number | undefined,
    estimatedTimeline: String(row.estimated_timeline ?? "To be confirmed"),
    message: String(row.message ?? ""),
    deliverables: (row.deliverables as string[] | null) ?? [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function toProject(row: Record<string, unknown>): Project {
  const scope = (row.scope ?? {}) as Record<string, string>;
  const aggregateCount = (value: unknown) => {
    if (Array.isArray(value)) return Number((value[0] as { count?: number } | undefined)?.count ?? 0);
    if (value && typeof value === "object") return Number((value as { count?: number }).count ?? 0);
    return Number(value ?? 0);
  };
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    title: String(row.title ?? "Untitled project"),
    description: String(row.description ?? ""),
    status: row.status as Project["status"],
    scopeType: String(scope.type ?? "custom"),
    scopeLabel: String(scope.label ?? scope.subtype ?? "Custom Project"),
    services: (row.services as string[] | null) ?? [],
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    locality: row.locality as string | undefined,
    budgetRange: String(row.budget_range ?? "Unknown"),
    customBudget: row.custom_budget as number | undefined,
    preferredStartDate: row.preferred_start_date as string | undefined,
    expectedTimeline: row.expected_timeline as string | undefined,
    filesCount: aggregateCount(row.files_count),
    proposalsCount: aggregateCount(row.proposals_count),
    selectedProfessionalId: row.selected_professional_id as string | undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    publishedAt: row.published_at as string | undefined,
  };
}

export async function getServices() {
  const supabase = await createClient();
  if (!supabase) return services;
  const { data, error } = await supabase.from("services").select("*").eq("is_active", true).order("sort_order");
  if (error || !data?.length) return services;
  return data.map((row) => ({
    id: row.id,
    category: row.category,
    name: row.name,
    slug: row.slug,
    roleScope: row.role_scope,
    description: row.description ?? "",
  }));
}

export async function getProfessionals(role?: UserRole | "all") {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase.from("profiles").select("*").in("primary_role", ["designer", "contractor"]).eq("account_status", "active");
  if (role && role !== "all") query = query.eq("primary_role", role);
  const { data, error } = await query.order("rating_avg", { ascending: false });
  if (error || !data) return [];
  return data.map(toProfile);
}

export async function getProjectsForRole(role: UserRole) {
  const supabase = await createClient();
  if (!supabase) return [];
  const discoverable = ["published", "receiving_proposals", "matching"];
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return [];
  const base = supabase.from("projects").select("*, files_count:project_files(count), proposals_count:proposals(count)");
  const query = role === "customer"
    ? base.eq("customer_id", authData.user.id).order("created_at", { ascending: false })
    : base.in("status", discoverable).order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(toProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*, files_count:project_files(count), proposals_count:proposals(count)").eq("id", id).single();
  if (error || !data) return null;
  return toProject(data);
}

export async function getDashboardSummary(role: UserRole) {
  const roleProjects = await getProjectsForRole(role);
  const supabase = await createClient();
  if (supabase) {
    const [proposalResult, notificationResult] = await Promise.all([
      supabase.from("proposals").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    ]);
    return {
      activeProjects: roleProjects.filter((project) => ["professional_selected", "discussion", "in_progress", "awaiting_customer_review"].includes(project.status)).length,
      publishedProjects: roleProjects.filter((project) => ["published", "receiving_proposals", "matching"].includes(project.status)).length,
      proposals: proposalResult.count ?? 0,
      unreadNotifications: notificationResult.count ?? 0,
    };
  }
  return {
    activeProjects: roleProjects.filter((project) => ["professional_selected", "discussion", "in_progress", "awaiting_customer_review"].includes(project.status)).length,
    publishedProjects: roleProjects.filter((project) => ["published", "receiving_proposals", "matching"].includes(project.status)).length,
    proposals: 0,
    unreadNotifications: 0,
  };
}

export async function getProposals(role: UserRole) {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase.from("proposals").select("*, professional:profiles!proposals_professional_id_fkey(full_name)").order("created_at", { ascending: false });
  if (role !== "customer" && role !== "admin") query = query.eq("professional_role", role);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map(toProposal);
}

export async function getNotifications() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, userId: row.user_id, projectId: row.project_id ?? undefined, kind: row.kind, message: row.message, readAt: row.read_at, createdAt: row.created_at }));
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", authData.user.id).single();
  return data ? toProfile(data) : null;
}

export async function getPortfolioForProfessional(id: string) {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("portfolio_projects").select("*").eq("professional_id", id).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, professionalId: row.professional_id, title: row.title, category: row.category ?? "Interior project", description: row.description ?? "", location: row.location ?? "", completionYear: row.completion_year ?? new Date(row.created_at).getFullYear(), servicesProvided: row.services_provided ?? [], isFeatured: row.is_featured ?? false }));
}

export async function getPublicWorkPhotos() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("portfolio_media")
    .select("id, storage_bucket, storage_path, professional_id, project:portfolio_projects(title, category, location, is_platform_verified)")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error || !data) return [];
  return data.flatMap((row) => {
    const project = Array.isArray(row.project) ? row.project[0] : row.project;
    if (!project?.is_platform_verified) return [];
    const { data: publicFile } = supabase.storage.from(row.storage_bucket).getPublicUrl(row.storage_path);
    return [{
      id: row.id,
      title: project.title,
      type: project.category || "Completed project",
      city: project.location || "India",
      image: publicFile.publicUrl,
      professionalId: row.professional_id,
    }];
  });
}

export async function getReviewsForProfessional(id: string) {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("reviews").select("id, customer_id, professional_id, project_id, rating, review_text, created_at").eq("professional_id", id).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, customerId: row.customer_id, professionalId: row.professional_id, projectId: row.project_id, rating: row.rating, reviewText: row.review_text ?? "", createdAt: row.created_at }));
}

export type VendorDashboardData = {
  enquiries: Array<{ id: string; subject: string; status: string; quotedAmount?: number; createdAt: string }>;
  orders: Array<{ id: string; status: string; totalAmount: number; expectedDeliveryDate?: string; createdAt: string }>;
  products: Array<{ id: string; name: string; category: string; price?: number; stockStatus: string }>;
};

export async function getVendorDashboardData(): Promise<VendorDashboardData> {
  const supabase = await createClient();
  if (!supabase) return { enquiries: [], orders: [], products: [] };
  const { data: authData } = await getActiveUser(supabase);
  if (!authData.user) return { enquiries: [], orders: [], products: [] };

  const [enquiriesResult, ordersResult, productsResult] = await Promise.all([
    supabase.from("vendor_enquiries").select("id, subject, status, quoted_amount, created_at").eq("vendor_id", authData.user.id).order("created_at", { ascending: false }),
    supabase.from("vendor_orders").select("id, status, total_amount, expected_delivery_date, created_at").eq("vendor_id", authData.user.id).order("created_at", { ascending: false }),
    supabase.from("vendor_products").select("id, name, category, price, stock_status").eq("vendor_id", authData.user.id).order("created_at", { ascending: false }),
  ]);

  return {
    enquiries: (enquiriesResult.data ?? []).map((row) => ({ id: row.id, subject: row.subject, status: row.status, quotedAmount: row.quoted_amount ?? undefined, createdAt: row.created_at })),
    orders: (ordersResult.data ?? []).map((row) => ({ id: row.id, status: row.status, totalAmount: Number(row.total_amount), expectedDeliveryDate: row.expected_delivery_date ?? undefined, createdAt: row.created_at })),
    products: (productsResult.data ?? []).map((row) => ({ id: row.id, name: row.name, category: row.category, price: row.price ?? undefined, stockStatus: row.stock_status })),
  };
}
