alter table public.requirements
  add column if not exists fulfillment_preference text not null default 'help_me_decide'
    check (fulfillment_preference in ('independent_professional', 'managed_execution', 'help_me_decide')),
  add column if not exists managed_execution_eligible boolean not null default false;

alter table public.projects
  add column if not exists fulfillment_preference text not null default 'help_me_decide'
    check (fulfillment_preference in ('independent_professional', 'managed_execution', 'help_me_decide'));

create table if not exists public.saved_inspirations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  image_url text not null,
  city text,
  project_type text,
  source_professional_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (account_id, title)
);

create table if not exists public.managed_execution_cases (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('MEX'),
  requirement_id uuid references public.requirements(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  sajivo_organization_id uuid references public.organizations(id) on delete restrict,
  acquisition_path text not null check (acquisition_path in ('customer_opt_in', 'marketplace_rescue', 'urgent_capacity', 'professional_takeover')),
  status text not null default 'eligibility_review' check (status in ('eligibility_review', 'eligible', 'offered', 'accepted', 'planning', 'active', 'qa', 'completed', 'declined', 'cancelled')),
  eligibility_reason text,
  economics jsonb not null default '{}'::jsonb,
  assigned_team jsonb not null default '[]'::jsonb,
  warranty_terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requirement_id is not null or project_id is not null)
);

create index if not exists saved_inspirations_account_created_idx
  on public.saved_inspirations(account_id, created_at desc);
create index if not exists saved_inspirations_professional_idx
  on public.saved_inspirations(source_professional_id)
  where source_professional_id is not null;
create index if not exists managed_execution_customer_status_idx
  on public.managed_execution_cases(customer_id, status, created_at desc);
create index if not exists managed_execution_organization_status_idx
  on public.managed_execution_cases(sajivo_organization_id, status)
  where sajivo_organization_id is not null;
create index if not exists managed_execution_project_idx
  on public.managed_execution_cases(project_id)
  where project_id is not null;
create unique index if not exists managed_execution_requirement_unique_idx
  on public.managed_execution_cases(requirement_id)
  where requirement_id is not null;
create unique index if not exists managed_execution_project_unique_idx
  on public.managed_execution_cases(project_id)
  where project_id is not null;

alter table public.saved_inspirations enable row level security;
alter table public.managed_execution_cases enable row level security;

create policy "accounts read own saved inspirations"
  on public.saved_inspirations for select to authenticated
  using ((select auth.uid()) = account_id);
create policy "accounts save own inspirations"
  on public.saved_inspirations for insert to authenticated
  with check ((select auth.uid()) = account_id);
create policy "accounts remove own inspirations"
  on public.saved_inspirations for delete to authenticated
  using ((select auth.uid()) = account_id);

create policy "customers read own managed execution cases"
  on public.managed_execution_cases for select to authenticated
  using ((select auth.uid()) = customer_id or public.is_platform_admin());
create policy "customers request managed execution"
  on public.managed_execution_cases for insert to authenticated
  with check (
    (select auth.uid()) = customer_id
    and (
      exists (
      select 1 from public.requirements r
      where r.id = requirement_id and r.customer_id = (select auth.uid())
      )
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.customer_id = (select auth.uid())
      )
    )
  );
create policy "admins manage managed execution cases"
  on public.managed_execution_cases for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, delete on public.saved_inspirations to authenticated;
grant select, insert, update, delete on public.managed_execution_cases to authenticated;
