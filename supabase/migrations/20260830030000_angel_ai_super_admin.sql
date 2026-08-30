-- Angel AI support and super-admin control plane.

create table if not exists public.platform_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('super_admin', 'support_admin', 'knowledge_manager', 'analyst')),
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  permissions text[] not null default '{}',
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_platform_admin(required_role text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.profile_id = (select auth.uid())
      and a.status = 'active'
      and (required_role is null or a.role = 'super_admin' or a.role = required_role)
  );
$$;

revoke all on function public.is_platform_admin(text) from public;
grant execute on function public.is_platform_admin(text) to authenticated;

create table if not exists public.ai_knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('account', 'projects', 'subscriptions', 'credits', 'payments', 'communication', 'security', 'support')),
  locale text not null default 'en' check (locale in ('en', 'hi')),
  summary text not null,
  body text not null,
  keywords text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_support_conversations (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('ANG'),
  account_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'waiting_for_human', 'resolved', 'closed')),
  locale text not null default 'en' check (locale in ('en', 'hi')),
  title text not null default 'Angel support conversation',
  summary text,
  last_message_at timestamptz not null default now(),
  escalated_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_support_conversations(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant', 'admin', 'system')),
  sender_profile_id uuid references public.profiles(id) on delete set null,
  content text not null check (char_length(content) between 1 and 12000),
  citations jsonb not null default '[]'::jsonb,
  model text,
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  safety_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.support_callback_requests (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.sajivo_public_id('CALL'),
  account_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.ai_support_conversations(id) on delete set null,
  ticket_id uuid references public.support_tickets(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  payment_id uuid references public.payment_records(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 2000),
  preferred_date date not null,
  time_window text not null,
  timezone text not null,
  communication_method text not null check (communication_method in ('phone', 'whatsapp', 'email', 'video')),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'completed', 'cancelled')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_request_events (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.ai_support_conversations(id) on delete set null,
  provider text not null default 'openrouter',
  model text not null,
  outcome text not null check (outcome in ('success', 'rejected', 'rate_limited', 'provider_error')),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_action_audit_logs (
  id bigint generated always as identity primary key,
  account_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.ai_support_conversations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'assistant', 'admin', 'system')),
  action text not null,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  outcome text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.support_tickets
  add column if not exists category text not null default 'support',
  add column if not exists priority text not null default 'normal',
  add column if not exists conversation_id uuid references public.ai_support_conversations(id) on delete set null,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists resolved_at timestamptz;

alter table public.platform_admins enable row level security;
alter table public.ai_knowledge_articles enable row level security;
alter table public.ai_support_conversations enable row level security;
alter table public.ai_support_messages enable row level security;
alter table public.support_callback_requests enable row level security;
alter table public.ai_request_events enable row level security;
alter table public.ai_action_audit_logs enable row level security;

create policy "admins read admin registry" on public.platform_admins for select to authenticated
using (profile_id = (select auth.uid()) or public.is_platform_admin());
create policy "super admins manage admin registry" on public.platform_admins for all to authenticated
using (public.is_platform_admin('super_admin')) with check (public.is_platform_admin('super_admin'));

create policy "users read published angel knowledge" on public.ai_knowledge_articles for select to authenticated
using (status = 'published' or public.is_platform_admin());
create policy "knowledge admins manage angel knowledge" on public.ai_knowledge_articles for all to authenticated
using (public.is_platform_admin('knowledge_manager')) with check (public.is_platform_admin('knowledge_manager'));

create policy "accounts read own angel conversations" on public.ai_support_conversations for select to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin());
create policy "accounts create own angel conversations" on public.ai_support_conversations for insert to authenticated
with check (account_id = (select auth.uid()));
create policy "accounts update own active angel conversations" on public.ai_support_conversations for update to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin('support_admin'))
with check (account_id = (select auth.uid()) or public.is_platform_admin('support_admin'));

create policy "participants read angel messages" on public.ai_support_messages for select to authenticated
using (exists (select 1 from public.ai_support_conversations c where c.id = conversation_id and (c.account_id = (select auth.uid()) or public.is_platform_admin())));
create policy "participants create angel messages" on public.ai_support_messages for insert to authenticated
with check (
  exists (select 1 from public.ai_support_conversations c where c.id = conversation_id and c.account_id = (select auth.uid()))
  or (sender = 'admin' and sender_profile_id = (select auth.uid()) and public.is_platform_admin('support_admin'))
);

create policy "accounts read own callback requests" on public.support_callback_requests for select to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin());
create policy "accounts create own callback requests" on public.support_callback_requests for insert to authenticated
with check (account_id = (select auth.uid()));
create policy "support admins update callbacks" on public.support_callback_requests for update to authenticated
using (public.is_platform_admin('support_admin')) with check (public.is_platform_admin('support_admin'));

create policy "accounts read own ai usage" on public.ai_request_events for select to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin('analyst'));
create policy "accounts create own ai usage" on public.ai_request_events for insert to authenticated
with check (account_id = (select auth.uid()));

create policy "admins read ai audit logs" on public.ai_action_audit_logs for select to authenticated
using (public.is_platform_admin());
create policy "accounts create own ai audit logs" on public.ai_action_audit_logs for insert to authenticated
with check (account_id = (select auth.uid()) or actor_id = (select auth.uid()) or public.is_platform_admin());

create policy "accounts create own support tickets" on public.support_tickets for insert to authenticated
with check (account_id = (select auth.uid()));
create policy "accounts update own open support tickets" on public.support_tickets for update to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin('support_admin'))
with check (account_id = (select auth.uid()) or public.is_platform_admin('support_admin'));

create index if not exists platform_admins_role_status_idx on public.platform_admins(role, status);
create index if not exists ai_knowledge_articles_search_idx on public.ai_knowledge_articles(status, locale, category);
create index if not exists ai_support_conversations_account_recent_idx on public.ai_support_conversations(account_id, last_message_at desc);
create index if not exists ai_support_conversations_status_recent_idx on public.ai_support_conversations(status, last_message_at desc);
create index if not exists ai_support_messages_conversation_created_idx on public.ai_support_messages(conversation_id, created_at);
create index if not exists support_callback_requests_status_date_idx on public.support_callback_requests(status, preferred_date);
create index if not exists ai_request_events_account_created_idx on public.ai_request_events(account_id, created_at desc);
create index if not exists ai_action_audit_logs_conversation_created_idx on public.ai_action_audit_logs(conversation_id, created_at desc);
create index if not exists support_tickets_conversation_idx on public.support_tickets(conversation_id) where conversation_id is not null;
create index if not exists support_tickets_assigned_idx on public.support_tickets(assigned_to, status) where assigned_to is not null;

grant select, insert, update on public.ai_support_conversations, public.ai_support_messages, public.support_callback_requests, public.support_tickets to authenticated;
grant select, insert on public.ai_request_events, public.ai_action_audit_logs to authenticated;
grant select on public.ai_knowledge_articles, public.platform_admins to authenticated;
grant insert, update, delete on public.ai_knowledge_articles, public.platform_admins to authenticated;
grant usage, select on sequence public.ai_request_events_id_seq, public.ai_action_audit_logs_id_seq to authenticated;

insert into public.ai_knowledge_articles (slug, title, category, summary, body, keywords, status, published_at)
values
  ('account-security-basics', 'Account and security basics', 'account', 'Manage profile details and Sajivo identity safely.', 'Use Profile to update contact details. Your Sajivo ID is the permanent support reference for your account. Never share your password, OTP, full card details, or recovery code with anyone, including support.', array['account','profile','sajivo id','login','recovery','otp'], 'published', now()),
  ('project-support', 'Project support', 'projects', 'Find requirements, proposals, files, milestones, and project status.', 'Open Projects and select the relevant workspace. The workspace contains the requirement, proposals, project files, team, tasks, milestones, messages, and payment-linked records. Include the project public ID when asking for help.', array['project','requirement','proposal','milestone','files','status'], 'published', now()),
  ('subscriptions-and-renewals', 'Subscriptions and renewals', 'subscriptions', 'Understand plans, entitlements, renewals, and upgrades.', 'Open Plans to view the current plan, entitlements, usage limits, renewal date, billing cycle, and upgrade options. A plan change that creates a charge must be confirmed by the account owner.', array['subscription','plan','renewal','upgrade','entitlement'], 'published', now()),
  ('credit-wallet-rules', 'Credit wallet rules', 'credits', 'Understand included credits, usage, resets, and top-ups.', 'Credits are recorded in the Sajivo credit wallet and usage ledger. Included credits follow the active plan cycle. Purchased top-ups are recorded separately. Angel can explain balances but cannot grant, reverse, or adjust credits autonomously.', array['credits','wallet','balance','reset','carry forward','top up'], 'published', now()),
  ('payments-invoices-receipts', 'Payments, invoices, and receipts', 'payments', 'Locate payment status and financial documents.', 'Open Documents & Payments in the relevant account or project. Use the public invoice, payment, or receipt reference when requesting help. Angel can explain status but cannot approve refunds, release funds, change bank details, or mark a payment complete.', array['payment','invoice','receipt','refund','bank','gst'], 'published', now()),
  ('communication-help', 'Messages and file sharing', 'communication', 'Use project-linked messages and files.', 'Project communication should remain inside the project workspace so messages and files retain project context. Use Messages for discussion and Files for documents, drawings, images, and project records.', array['message','chat','upload','document','communication'], 'published', now()),
  ('human-support-handoff', 'Human support handoff', 'support', 'Escalate an unresolved or sensitive issue to the Sajivo team.', 'Angel must offer human support when information is insufficient, the user requests a person, or the issue is sensitive or high risk. The handoff includes the conversation context and relevant account, project, ticket, or payment reference.', array['human','agent','ticket','escalate','support'], 'published', now()),
  ('support-call-scheduling', 'Schedule a support call', 'support', 'Information required to arrange a real support call.', 'A callback request requires the reason, preferred date, time window, timezone, communication method, account identity, and any relevant project, payment, or support reference.', array['call','callback','schedule','phone','whatsapp','video'], 'published', now()),
  ('angel-safety-boundaries', 'Angel safety boundaries', 'security', 'Actions Angel cannot perform autonomously.', 'Angel must not autonomously approve refunds, execute payments, change bank details, change identity information, bypass verification, disclose another account, or perform any other sensitive high-risk action. These cases require authenticated human review.', array['safety','refund','payment','bank','identity','verification'], 'published', now())
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  body = excluded.body,
  keywords = excluded.keywords,
  status = excluded.status,
  published_at = coalesce(public.ai_knowledge_articles.published_at, excluded.published_at),
  version = public.ai_knowledge_articles.version + 1,
  updated_at = now();
