-- Harden the unified platform after the additive architecture migration.

alter function public.sajivo_public_id(text) set search_path = '';

create index if not exists account_subscriptions_plan_id_fk_idx on public.account_subscriptions (plan_id);
create index if not exists catalog_items_provider_organization_id_fk_idx on public.catalog_items (provider_organization_id);
create index if not exists credit_transactions_wallet_id_fk_idx on public.credit_transactions (wallet_id);
create index if not exists digital_contracts_organization_id_fk_idx on public.digital_contracts (organization_id);
create index if not exists digital_contracts_project_id_fk_idx on public.digital_contracts (project_id);
create index if not exists digital_contracts_requirement_id_fk_idx on public.digital_contracts (requirement_id);
create index if not exists document_records_contract_id_fk_idx on public.document_records (contract_id);
create index if not exists document_records_organization_id_fk_idx on public.document_records (organization_id);
create index if not exists estimation_rate_versions_created_by_fk_idx on public.estimation_rate_versions (created_by);
create index if not exists financial_audit_logs_account_id_fk_idx on public.financial_audit_logs (account_id);
create index if not exists financial_audit_logs_actor_id_fk_idx on public.financial_audit_logs (actor_id);
create index if not exists financial_audit_logs_document_id_fk_idx on public.financial_audit_logs (document_id);
create index if not exists financial_audit_logs_payment_id_fk_idx on public.financial_audit_logs (payment_id);
create index if not exists financial_document_items_document_id_fk_idx on public.financial_document_items (document_id);
create index if not exists financial_documents_parent_document_id_fk_idx on public.financial_documents (parent_document_id);
create index if not exists financial_documents_project_id_fk_idx on public.financial_documents (project_id);
create index if not exists opportunities_match_id_fk_idx on public.opportunities (match_id);
create index if not exists opportunities_organization_id_fk_idx on public.opportunities (organization_id);
create index if not exists opportunities_requirement_id_fk_idx on public.opportunities (requirement_id);
create index if not exists payment_events_payment_id_fk_idx on public.payment_events (payment_id);
create index if not exists payment_records_invoice_id_fk_idx on public.payment_records (invoice_id);
create index if not exists payment_records_project_id_fk_idx on public.payment_records (project_id);
create index if not exists project_tasks_created_by_fk_idx on public.project_tasks (created_by);
create index if not exists project_tasks_milestone_id_fk_idx on public.project_tasks (milestone_id);
create index if not exists project_team_members_organization_id_fk_idx on public.project_team_members (organization_id);
create index if not exists receipts_account_id_fk_idx on public.receipts (account_id);
create index if not exists receipts_invoice_id_fk_idx on public.receipts (invoice_id);
create index if not exists requirement_matches_organization_id_fk_idx on public.requirement_matches (organization_id);
create index if not exists support_access_audit_account_id_fk_idx on public.support_access_audit (account_id);
create index if not exists support_access_audit_agent_id_fk_idx on public.support_access_audit (agent_id);
create index if not exists support_tickets_payment_id_fk_idx on public.support_tickets (payment_id);
create index if not exists support_tickets_project_id_fk_idx on public.support_tickets (project_id);
create index if not exists trust_events_organization_id_fk_idx on public.trust_events (organization_id);
create index if not exists trust_events_project_id_fk_idx on public.trust_events (project_id);
create index if not exists usage_events_subscription_id_fk_idx on public.usage_events (subscription_id);

drop policy if exists "members read own membership" on public.organization_members;
drop policy if exists "owners manage organization members" on public.organization_members;
create policy "members access organization membership"
on public.organization_members for all to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.organizations organization
    where organization.id = organization_members.organization_id
      and organization.owner_profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.organizations organization
    where organization.id = organization_members.organization_id
      and organization.owner_profile_id = (select auth.uid())
  )
);

create policy "account owners read financial audit logs"
on public.financial_audit_logs for select to authenticated
using (account_id = (select auth.uid()));

create policy "account owners read payment events"
on public.payment_events for select to authenticated
using (
  exists (
    select 1 from public.payment_records payment
    where payment.id = payment_events.payment_id
      and payment.account_id = (select auth.uid())
  )
);

create policy "account owners read support access audit"
on public.support_access_audit for select to authenticated
using (account_id = (select auth.uid()));
