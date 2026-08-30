create policy "platform admins read support tickets" on public.support_tickets for select to authenticated
using (public.is_platform_admin());

create policy "platform admins read support access audit" on public.support_access_audit for select to authenticated
using (public.is_platform_admin());

grant select on public.support_access_audit to authenticated;

comment on table public.platform_admins is 'Server-authoritative platform administration registry. Do not derive access from editable profile metadata.';
comment on table public.ai_knowledge_articles is 'Approved, versioned knowledge supplied to Angel AI.';
comment on table public.ai_action_audit_logs is 'Append-only audit events for AI and support actions.';
