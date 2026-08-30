drop policy if exists "team members read project team" on public.project_team_members;
create policy "project participants read project team" on public.project_team_members for select to authenticated
using (
  profile_id = (select auth.uid()) or exists (
    select 1 from public.projects p where p.id = project_id and (select auth.uid()) in (p.customer_id,p.selected_professional_id)
  )
);
create policy "project leads invite team members" on public.project_team_members for insert to authenticated
with check (exists (select 1 from public.projects p where p.id=project_id and (select auth.uid()) in (p.customer_id,p.selected_professional_id)));
create policy "project leads update team members" on public.project_team_members for update to authenticated
using (exists (select 1 from public.projects p where p.id=project_id and (select auth.uid()) in (p.customer_id,p.selected_professional_id)))
with check (exists (select 1 from public.projects p where p.id=project_id and (select auth.uid()) in (p.customer_id,p.selected_professional_id)));
create policy "project leads remove team members" on public.project_team_members for delete to authenticated
using (exists (select 1 from public.projects p where p.id=project_id and (select auth.uid()) in (p.customer_id,p.selected_professional_id)));
grant delete on public.project_team_members to authenticated;
