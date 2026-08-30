create or replace function public.is_platform_admin(required_role text default null)
returns boolean
language sql
stable
security invoker
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

revoke execute on function public.is_platform_admin(text) from public, anon;
grant execute on function public.is_platform_admin(text) to authenticated;

drop policy if exists "admins read admin registry" on public.platform_admins;
drop policy if exists "super admins manage admin registry" on public.platform_admins;
create policy "admins read own registry entry" on public.platform_admins for select to authenticated
using (profile_id = (select auth.uid()));
create policy "super admins create registry entries" on public.platform_admins for insert to authenticated
with check (public.is_platform_admin('super_admin'));
create policy "super admins update registry entries" on public.platform_admins for update to authenticated
using (public.is_platform_admin('super_admin')) with check (public.is_platform_admin('super_admin'));
create policy "super admins delete registry entries" on public.platform_admins for delete to authenticated
using (public.is_platform_admin('super_admin'));

drop policy if exists "knowledge admins manage angel knowledge" on public.ai_knowledge_articles;
create policy "knowledge admins create angel knowledge" on public.ai_knowledge_articles for insert to authenticated
with check (public.is_platform_admin('knowledge_manager'));
create policy "knowledge admins update angel knowledge" on public.ai_knowledge_articles for update to authenticated
using (public.is_platform_admin('knowledge_manager')) with check (public.is_platform_admin('knowledge_manager'));
create policy "knowledge admins delete angel knowledge" on public.ai_knowledge_articles for delete to authenticated
using (public.is_platform_admin('knowledge_manager'));

drop policy if exists "account reads own tickets" on public.support_tickets;
drop policy if exists "platform admins read support tickets" on public.support_tickets;
create policy "accounts and admins read support tickets" on public.support_tickets for select to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists "account owners read support access audit" on public.support_access_audit;
drop policy if exists "platform admins read support access audit" on public.support_access_audit;
create policy "accounts and admins read support access audit" on public.support_access_audit for select to authenticated
using (account_id = (select auth.uid()) or public.is_platform_admin());

create index if not exists platform_admins_granted_by_idx on public.platform_admins(granted_by) where granted_by is not null;
create index if not exists ai_knowledge_articles_created_by_idx on public.ai_knowledge_articles(created_by) where created_by is not null;
create index if not exists ai_knowledge_articles_approved_by_idx on public.ai_knowledge_articles(approved_by) where approved_by is not null;
create index if not exists ai_support_conversations_project_idx on public.ai_support_conversations(project_id) where project_id is not null;
create index if not exists ai_support_messages_sender_profile_idx on public.ai_support_messages(sender_profile_id) where sender_profile_id is not null;
create index if not exists support_callback_requests_account_idx on public.support_callback_requests(account_id);
create index if not exists support_callback_requests_conversation_idx on public.support_callback_requests(conversation_id) where conversation_id is not null;
create index if not exists support_callback_requests_ticket_idx on public.support_callback_requests(ticket_id) where ticket_id is not null;
create index if not exists support_callback_requests_project_idx on public.support_callback_requests(project_id) where project_id is not null;
create index if not exists support_callback_requests_payment_idx on public.support_callback_requests(payment_id) where payment_id is not null;
create index if not exists support_callback_requests_assigned_idx on public.support_callback_requests(assigned_to) where assigned_to is not null;
create index if not exists ai_request_events_conversation_idx on public.ai_request_events(conversation_id) where conversation_id is not null;
create index if not exists ai_action_audit_logs_account_idx on public.ai_action_audit_logs(account_id) where account_id is not null;
create index if not exists ai_action_audit_logs_actor_idx on public.ai_action_audit_logs(actor_id) where actor_id is not null;
