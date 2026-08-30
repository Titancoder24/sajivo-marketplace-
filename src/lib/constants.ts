import type { ProjectStatus, ProposalStatus, UserRole } from "@/types/domain";

export const appName = "Sajivo";

export const roleLabels: Record<UserRole, string> = {
  customer: "Customer",
  designer: "Interior Designer",
  contractor: "Execution Contractor",
  vendor: "Retail Vendor",
  admin: "Admin",
};

export const roleDashboardPath: Record<UserRole, string> = {
  customer: "/customer/dashboard",
  designer: "/designer/dashboard",
  contractor: "/contractor/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/v2/admin",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: "Draft",
  published: "Published",
  receiving_proposals: "Receiving proposals",
  matching: "Matching",
  professional_selected: "Professional selected",
  discussion: "Discussion",
  in_progress: "In progress",
  awaiting_customer_review: "Awaiting customer review",
  revision_required: "Revision required",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const scopeOptions = [
  {
    id: "single_item",
    title: "Single Item / Small Task",
    description: "One wall, one ceiling, one wardrobe, modular kitchen, flooring area, or an installation job.",
    subtypes: ["One Wall", "One Ceiling", "One Wardrobe", "One Modular Kitchen", "One Flooring Area", "One Installation Job", "Other Small Requirement"],
  },
  {
    id: "single_room",
    title: "Single Room",
    description: "Bedroom, living room, dining room, kitchen, bathroom, office room, or another focused space.",
    subtypes: ["Bedroom", "Living Room", "Dining Room", "Kitchen", "Bathroom", "Office Room", "Other Room"],
  },
  {
    id: "multi_room",
    title: "Multiple Rooms",
    description: "A coordinated project across several spaces with one design or execution brief.",
    subtypes: ["Bedroom", "Living Room", "Dining Room", "Kitchen", "Bathroom", "Office Room", "Balcony", "Study", "Kids Room", "Other Room"],
  },
  {
    id: "complete_property",
    title: "Complete Property",
    description: "Complete home, villa, apartment, office, shop, restaurant, or commercial property.",
    subtypes: ["Complete Home", "Villa", "Apartment", "Office", "Shop", "Restaurant", "Commercial Property", "Other Property"],
  },
  {
    id: "custom",
    title: "Custom Project",
    description: "A flexible brief when your requirement does not fit one of the standard scopes.",
    subtypes: ["Custom Requirement"],
  },
] as const;

export const budgetOptions = [
  "Unknown",
  "Under Rs 25,000",
  "Rs 25,000 - Rs 50,000",
  "Rs 50,000 - Rs 1,00,000",
  "Rs 1,00,000 - Rs 3,00,000",
  "Rs 3,00,000 - Rs 5,00,000",
  "Rs 5,00,000 - Rs 10,00,000",
  "Above Rs 10,00,000",
  "Custom budget",
];
