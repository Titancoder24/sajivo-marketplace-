create or replace function public.is_project_participant(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
  ) or exists (
    select 1
    from public.project_team_members tm
    where tm.project_id = target_project_id
      and tm.profile_id = (select auth.uid())
      and tm.status = 'active'
  );
$$;

revoke all on function public.is_project_participant(uuid) from public;
grant execute on function public.is_project_participant(uuid) to authenticated;

drop policy if exists "project participants read tasks" on public.project_tasks;
create policy "project participants read tasks"
on public.project_tasks for select to authenticated
using (public.is_project_participant(project_id));

drop policy if exists "project participants create tasks" on public.project_tasks;
create policy "project participants create tasks"
on public.project_tasks for insert to authenticated
with check (
  public.is_project_participant(project_id)
  and created_by = (select auth.uid())
);

drop policy if exists "project participants update tasks" on public.project_tasks;
create policy "project participants update tasks"
on public.project_tasks for update to authenticated
using (public.is_project_participant(project_id))
with check (public.is_project_participant(project_id));

drop policy if exists "project participants delete tasks" on public.project_tasks;
create policy "project participants delete tasks"
on public.project_tasks for delete to authenticated
using (public.is_project_participant(project_id));

grant delete on public.project_tasks to authenticated;
