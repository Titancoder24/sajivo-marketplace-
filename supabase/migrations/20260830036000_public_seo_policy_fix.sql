drop policy if exists "everyone reads published seo pages" on public.seo_pages;
drop policy if exists "everyone reads published seo keywords" on public.seo_keyword_targets;
drop policy if exists "admins read all seo pages" on public.seo_pages;
drop policy if exists "admins read all seo keywords" on public.seo_keyword_targets;

create policy "public reads published seo pages"
on public.seo_pages
for select
to anon, authenticated
using (status = 'published');

create policy "admins read all seo pages"
on public.seo_pages
for select
to authenticated
using (public.is_platform_admin());

create policy "public reads published seo keywords"
on public.seo_keyword_targets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.seo_pages p
    where p.id = page_id
      and p.status = 'published'
  )
);

create policy "admins read all seo keywords"
on public.seo_keyword_targets
for select
to authenticated
using (public.is_platform_admin());

