drop policy if exists "customers read own projects" on public.projects;
drop policy if exists "assigned professionals read projects" on public.projects;
drop policy if exists "business accounts discover published projects" on public.projects;

create policy "projects visible to authorized participants"
on public.projects for select to authenticated
using (
  (select auth.uid()) = customer_id
  or (select auth.uid()) = selected_professional_id
  or (
    status in ('published', 'receiving_proposals', 'matching')
    and exists (
      select 1
      from public.profiles requester
      where requester.id = (select auth.uid())
        and requester.account_status = 'active'
        and requester.account_type = 'business'
        and requester.primary_role in ('designer', 'contractor', 'vendor')
    )
  )
);
