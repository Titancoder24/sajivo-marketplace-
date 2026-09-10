drop policy if exists "projects visible to participants" on public.projects;

create policy "customers read own projects"
on public.projects for select to authenticated
using ((select auth.uid()) = customer_id);

create policy "assigned professionals read projects"
on public.projects for select to authenticated
using ((select auth.uid()) = selected_professional_id);

create policy "business accounts discover published projects"
on public.projects for select to authenticated
using (
  status in ('published', 'receiving_proposals', 'matching')
  and exists (
    select 1
    from public.profiles requester
    where requester.id = (select auth.uid())
      and requester.account_status = 'active'
      and requester.account_type = 'business'
      and requester.primary_role in ('designer', 'contractor', 'vendor')
  )
);
