-- Remote migration version confirmed through Supabase MCP.
-- Contact snapshots preserve the details supplied with each callback request.
alter table public.support_callback_requests
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

create policy "support staff read account contacts" on public.profiles
for select to authenticated using ((select public.is_platform_admin('support_admin')));

create policy "super admins manage non admin profiles" on public.profiles
for update to authenticated
using ((select public.is_platform_admin('super_admin')) and not exists (
  select 1 from public.platform_admins a where a.profile_id = profiles.id
))
with check ((select public.is_platform_admin('super_admin')) and not exists (
  select 1 from public.platform_admins a where a.profile_id = profiles.id
));

-- Audit contact edits and lifecycle changes in the same transaction.
create or replace function public.audit_admin_profile_changes()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() <> new.id then
    insert into public.ai_action_audit_logs
      (account_id, actor_id, actor_type, action, risk_level, outcome, metadata)
    values (new.id, auth.uid(), 'admin', 'account_updated', 'medium', 'success',
      jsonb_build_object('previous_status', old.account_status, 'status', new.account_status,
        'changed_fields', (select jsonb_agg(n.key) from jsonb_each(to_jsonb(new)) n
          where n.value is distinct from to_jsonb(old)->n.key)));
  end if;
  return new;
end; $$;
revoke all on function public.audit_admin_profile_changes() from public, anon, authenticated;
create trigger audit_admin_profile_changes after update on public.profiles
for each row execute function public.audit_admin_profile_changes();
