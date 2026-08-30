drop policy if exists "project participants read tasks" on public.project_tasks;
drop policy if exists "project participants create tasks" on public.project_tasks;
drop policy if exists "project participants update tasks" on public.project_tasks;
drop policy if exists "project participants delete tasks" on public.project_tasks;

create policy "project participants read tasks"
on public.project_tasks for select to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
  ) or exists (
    select 1 from public.project_team_members tm
    where tm.project_id = project_id and tm.profile_id = (select auth.uid()) and tm.status = 'active'
  )
);

create policy "project participants create tasks"
on public.project_tasks for insert to authenticated
with check (
  created_by = (select auth.uid()) and (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
    ) or exists (
      select 1 from public.project_team_members tm
      where tm.project_id = project_id and tm.profile_id = (select auth.uid()) and tm.status = 'active'
    )
  )
);

create policy "project participants update tasks"
on public.project_tasks for update to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
  ) or exists (
    select 1 from public.project_team_members tm
    where tm.project_id = project_id and tm.profile_id = (select auth.uid()) and tm.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
  ) or exists (
    select 1 from public.project_team_members tm
    where tm.project_id = project_id and tm.profile_id = (select auth.uid()) and tm.status = 'active'
  )
);

create policy "project participants delete tasks"
on public.project_tasks for delete to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and (select auth.uid()) in (p.customer_id, p.selected_professional_id)
  ) or exists (
    select 1 from public.project_team_members tm
    where tm.project_id = project_id and tm.profile_id = (select auth.uid()) and tm.status = 'active'
  )
);

drop function if exists public.is_project_participant(uuid);
