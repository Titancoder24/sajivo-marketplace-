-- SAJIVO v1.0: unified marketplace, Business OS and SAIOS foundation.
-- This migration is additive and preserves every legacy table and route.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  public_id text not null unique default public.sajivo_public_id('ORG'),
  name text not null,
  organization_type text not null check (organization_type in ('customer_business', 'design_studio', 'architecture_firm', 'contractor', 'vendor', 'supplier', 'sajivo')),
  legal_name text,
  tax_identifier text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'rejected', 'suspended')),
  capacity jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'project_manager', 'architect', 'designer', 'engineer', 'supervisor', 'worker', 'specialist', 'accountant', 'authorized_representative')),
  permissions text[] not null default '{}',
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  proposal_authority boolean not null default false,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('REQ'),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null,
  project_type text not null,
  location jsonb not null default '{}'::jsonb,
  budget jsonb not null default '{}'::jsonb,
  style_preferences text[] not null default '{}',
  services text[] not null default '{}',
  timeline jsonb not null default '{}'::jsonb,
  structured_brief jsonb not null default '{}'::jsonb,
  ai_summary text,
  status text not null default 'draft' check (status in ('draft', 'published', 'matching', 'receiving_proposals', 'selected', 'converted', 'cancelled', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requirement_matches (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  compatibility_score numeric(5,2) not null check (compatibility_score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  allocation_wave smallint not null default 1 check (allocation_wave > 0),
  status text not null default 'eligible' check (status in ('eligible', 'allocated', 'viewed', 'responded', 'expired', 'withheld')),
  allocated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (requirement_id, professional_id)
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('OPP'),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  match_id uuid references public.requirement_matches(id) on delete set null,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'viewed', 'interested', 'declined', 'proposal_submitted', 'expired', 'closed')),
  response_deadline timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.digital_contracts (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('CTR'),
  project_id uuid references public.projects(id) on delete set null,
  requirement_id uuid references public.requirements(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid not null references public.profiles(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null,
  version integer not null default 1 check (version > 0),
  terms jsonb not null default '{}'::jsonb,
  total_value numeric(14,2) not null default 0 check (total_value >= 0),
  currency text not null default 'INR',
  status text not null default 'draft' check (status in ('draft', 'sent', 'partially_signed', 'executed', 'active', 'completed', 'terminated', 'void')),
  effective_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.digital_contracts(id) on delete cascade,
  signer_id uuid not null references public.profiles(id) on delete restrict,
  signer_role text not null,
  provider text,
  provider_reference text,
  ip_hash text,
  signed_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'signed', 'declined', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  unique (contract_id, signer_id)
);

create table if not exists public.project_team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  role text not null,
  permissions text[] not null default '{}',
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('MLS'),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  sequence integer not null check (sequence > 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  due_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'submitted', 'approved', 'invoiced', 'paid', 'blocked', 'cancelled')),
  completion_evidence jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, sequence)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('TSK'),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('CAT'),
  provider_organization_id uuid references public.organizations(id) on delete set null,
  item_type text not null check (item_type in ('space', 'element', 'material', 'finish', 'brand', 'product', 'specification', 'service')),
  parent_id uuid references public.catalog_items(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  attributes jsonb not null default '{}'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  audience text not null check (audience in ('customer', 'professional', 'vendor', 'organization')),
  billing_period text not null check (billing_period in ('monthly', 'quarterly', 'annual', 'lifetime')),
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'INR',
  entitlements jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('SUB'),
  account_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.account_subscriptions(id) on delete set null,
  event_type text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.document_records (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('AST'),
  account_id uuid not null references public.profiles(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  contract_id uuid references public.digital_contracts(id) on delete set null,
  document_type text not null,
  title text not null,
  version integer not null default 1 check (version > 0),
  storage_bucket text not null,
  storage_path text not null,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft', 'active', 'superseded', 'revoked', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('TRS'),
  subject_profile_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  score_delta numeric(8,3) not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists organizations_owner_idx on public.organizations(owner_profile_id, created_at desc);
create index if not exists organization_members_profile_idx on public.organization_members(profile_id, status);
create index if not exists requirements_customer_status_idx on public.requirements(customer_id, status, created_at desc);
create index if not exists requirements_organization_idx on public.requirements(organization_id, created_at desc);
create index if not exists requirement_matches_requirement_score_idx on public.requirement_matches(requirement_id, compatibility_score desc);
create index if not exists requirement_matches_professional_idx on public.requirement_matches(professional_id, status, created_at desc);
create index if not exists opportunities_professional_status_idx on public.opportunities(professional_id, status, created_at desc);
create index if not exists digital_contracts_customer_idx on public.digital_contracts(customer_id, status, created_at desc);
create index if not exists digital_contracts_professional_idx on public.digital_contracts(professional_id, status, created_at desc);
create index if not exists contract_signatures_signer_idx on public.contract_signatures(signer_id, status);
create index if not exists project_team_members_profile_idx on public.project_team_members(profile_id, status);
create index if not exists project_milestones_project_status_idx on public.project_milestones(project_id, status, sequence);
create index if not exists project_tasks_project_status_idx on public.project_tasks(project_id, status, due_at);
create index if not exists project_tasks_assignee_idx on public.project_tasks(assignee_id, status, due_at);
create index if not exists catalog_items_parent_idx on public.catalog_items(parent_id);
create index if not exists catalog_items_type_active_idx on public.catalog_items(item_type, is_active);
create index if not exists account_subscriptions_account_idx on public.account_subscriptions(account_id, status);
create index if not exists account_subscriptions_organization_idx on public.account_subscriptions(organization_id, status);
create index if not exists usage_events_account_type_idx on public.usage_events(account_id, event_type, occurred_at desc);
create index if not exists document_records_account_idx on public.document_records(account_id, created_at desc);
create index if not exists document_records_project_idx on public.document_records(project_id, created_at desc);
create index if not exists trust_events_subject_idx on public.trust_events(subject_profile_id, status, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_matches enable row level security;
alter table public.opportunities enable row level security;
alter table public.digital_contracts enable row level security;
alter table public.contract_signatures enable row level security;
alter table public.project_team_members enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_tasks enable row level security;
alter table public.catalog_items enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.account_subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.document_records enable row level security;
alter table public.trust_events enable row level security;

drop policy if exists "organization owners manage organizations" on public.organizations;
create policy "organization owners manage organizations" on public.organizations for all to authenticated
using ((select auth.uid()) = owner_profile_id) with check ((select auth.uid()) = owner_profile_id);

drop policy if exists "members read own membership" on public.organization_members;
create policy "members read own membership" on public.organization_members for select to authenticated
using ((select auth.uid()) = profile_id or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_profile_id = (select auth.uid())));

drop policy if exists "owners manage organization members" on public.organization_members;
create policy "owners manage organization members" on public.organization_members for all to authenticated
using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_profile_id = (select auth.uid())))
with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_profile_id = (select auth.uid())));

drop policy if exists "customers manage requirements" on public.requirements;
create policy "customers manage requirements" on public.requirements for all to authenticated
using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);

drop policy if exists "matched professionals read matches" on public.requirement_matches;
create policy "matched professionals read matches" on public.requirement_matches for select to authenticated
using ((select auth.uid()) = professional_id or exists (select 1 from public.requirements r where r.id = requirement_id and r.customer_id = (select auth.uid())));

drop policy if exists "opportunity participants read" on public.opportunities;
create policy "opportunity participants read" on public.opportunities for select to authenticated
using ((select auth.uid()) = professional_id or exists (select 1 from public.requirements r where r.id = requirement_id and r.customer_id = (select auth.uid())));

drop policy if exists "professionals update own opportunities" on public.opportunities;
create policy "professionals update own opportunities" on public.opportunities for update to authenticated
using ((select auth.uid()) = professional_id) with check ((select auth.uid()) = professional_id);

drop policy if exists "contract parties read contracts" on public.digital_contracts;
create policy "contract parties read contracts" on public.digital_contracts for select to authenticated
using ((select auth.uid()) in (customer_id, professional_id));

drop policy if exists "contract signers read signatures" on public.contract_signatures;
create policy "contract signers read signatures" on public.contract_signatures for select to authenticated
using ((select auth.uid()) = signer_id or exists (select 1 from public.digital_contracts c where c.id = contract_id and (select auth.uid()) in (c.customer_id, c.professional_id)));

drop policy if exists "team members read project team" on public.project_team_members;
create policy "team members read project team" on public.project_team_members for select to authenticated
using ((select auth.uid()) = profile_id or exists (select 1 from public.projects p where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)));

drop policy if exists "project participants read milestones" on public.project_milestones;
create policy "project participants read milestones" on public.project_milestones for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)));

drop policy if exists "project participants read tasks" on public.project_tasks;
create policy "project participants read tasks" on public.project_tasks for select to authenticated
using ((select auth.uid()) in (assignee_id, created_by) or exists (select 1 from public.projects p where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)));

drop policy if exists "active catalog is discoverable" on public.catalog_items;
create policy "active catalog is discoverable" on public.catalog_items for select to anon, authenticated using (is_active = true);

drop policy if exists "active plans are discoverable" on public.subscription_plans;
create policy "active plans are discoverable" on public.subscription_plans for select to anon, authenticated using (is_active = true);

drop policy if exists "accounts read own subscriptions" on public.account_subscriptions;
create policy "accounts read own subscriptions" on public.account_subscriptions for select to authenticated using ((select auth.uid()) = account_id);

drop policy if exists "accounts read own usage" on public.usage_events;
create policy "accounts read own usage" on public.usage_events for select to authenticated using ((select auth.uid()) = account_id);

drop policy if exists "accounts read own documents" on public.document_records;
create policy "accounts read own documents" on public.document_records for select to authenticated using ((select auth.uid()) = account_id);

drop policy if exists "subjects read trust events" on public.trust_events;
create policy "subjects read trust events" on public.trust_events for select to authenticated using ((select auth.uid()) = subject_profile_id);

grant select, insert, update on public.organizations, public.organization_members, public.requirements, public.opportunities, public.digital_contracts, public.contract_signatures, public.project_team_members, public.project_milestones, public.project_tasks, public.account_subscriptions, public.usage_events, public.document_records to authenticated;
grant select on public.requirement_matches, public.trust_events to authenticated;
grant select on public.catalog_items, public.subscription_plans to anon, authenticated;

insert into public.subscription_plans (slug, name, audience, billing_period, price, entitlements, limits, sort_order)
values
  ('customer-free', 'Customer Free', 'customer', 'lifetime', 0, '{"requirements": true, "project_workspace": true}'::jsonb, '{"active_requirements": 1, "ai_credits": 10}'::jsonb, 10),
  ('professional-grow', 'Professional Grow', 'professional', 'monthly', 1499, '{"opportunities": true, "proposals": true, "team": true, "analytics": true}'::jsonb, '{"proposal_credits": 25, "team_members": 5, "ai_credits": 100}'::jsonb, 20),
  ('vendor-scale', 'Vendor Scale', 'vendor', 'monthly', 1999, '{"catalog": true, "enquiries": true, "orders": true, "analytics": true}'::jsonb, '{"products": 500, "team_members": 10, "ai_credits": 150}'::jsonb, 30),
  ('organization-pro', 'Organization Pro', 'organization', 'monthly', 4999, '{"multi_project": true, "advanced_permissions": true, "finance": true, "analytics": true}'::jsonb, '{"active_projects": 50, "team_members": 50, "ai_credits": 1000}'::jsonb, 40)
on conflict (slug) do update set
  name = excluded.name,
  audience = excluded.audience,
  billing_period = excluded.billing_period,
  price = excluded.price,
  entitlements = excluded.entitlements,
  limits = excluded.limits,
  sort_order = excluded.sort_order,
  updated_at = now();
