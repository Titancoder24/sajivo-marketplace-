create table if not exists public.platform_contact_settings (
  singleton boolean primary key default true check (singleton),
  phone_number text check (phone_number is null or char_length(phone_number) between 7 and 30),
  email_address text check (email_address is null or char_length(email_address) between 5 and 254),
  show_phone boolean not null default false,
  show_email boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  requested_count integer not null check (requested_count between 1 and 2000),
  generated_count integer not null default 0 check (generated_count between 0 and 2000),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  configuration jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.seo_pages
  add column if not exists quality_status text not null default 'needs_review'
    check (quality_status in ('needs_review', 'approved', 'rejected')),
  add column if not exists answer_summary text,
  add column if not exists entity_data jsonb not null default '{}'::jsonb,
  add column if not exists indexing_allowed boolean not null default false;

update public.seo_pages
set quality_status = 'approved', indexing_allowed = true
where status = 'published';

insert into public.platform_contact_settings(singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.platform_contact_settings enable row level security;
alter table public.seo_generation_jobs enable row level security;

create policy "super admins manage lead contacts"
on public.platform_contact_settings for all to authenticated
using (public.is_platform_admin('super_admin'))
with check (public.is_platform_admin('super_admin'));

create policy "super admins read seo generation jobs"
on public.seo_generation_jobs for select to authenticated
using (public.is_platform_admin('super_admin'));

create policy "super admins create seo generation jobs"
on public.seo_generation_jobs for insert to authenticated
with check (public.is_platform_admin('super_admin') and requested_by = (select auth.uid()));

create policy "super admins update seo generation jobs"
on public.seo_generation_jobs for update to authenticated
using (public.is_platform_admin('super_admin'))
with check (public.is_platform_admin('super_admin'));

create index if not exists seo_pages_indexing_status_idx
  on public.seo_pages(status, indexing_allowed, updated_at desc);
create index if not exists seo_generation_jobs_created_idx
  on public.seo_generation_jobs(created_at desc);

grant select on public.platform_contact_settings to authenticated;
grant insert, update on public.platform_contact_settings to authenticated;
grant select, insert, update on public.seo_generation_jobs to authenticated;

create or replace function public.get_public_contact_settings()
returns table(phone_number text, email_address text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case when show_phone then platform_contact_settings.phone_number else null end,
    case when show_email then platform_contact_settings.email_address else null end
  from public.platform_contact_settings
  where singleton = true;
$$;

revoke execute on function public.get_public_contact_settings() from public;
grant execute on function public.get_public_contact_settings() to anon, authenticated;

create or replace function public.admin_analytics_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select case when public.is_platform_admin('analyst') then jsonb_build_object(
    'dau', (select count(distinct account_id) from public.analytics_events where account_id is not null and occurred_at >= now() - interval '1 day'),
    'wau', (select count(distinct account_id) from public.analytics_events where account_id is not null and occurred_at >= now() - interval '7 days'),
    'mau', (select count(distinct account_id) from public.analytics_events where account_id is not null and occurred_at >= now() - interval '30 days'),
    'sessions24h', (select count(distinct session_id) from public.analytics_events where occurred_at >= now() - interval '1 day'),
    'sessions30d', (select count(distinct session_id) from public.analytics_events where occurred_at >= now() - interval '30 days'),
    'pageViews24h', (select count(*) from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '1 day'),
    'pageViews30d', (select count(*) from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days'),
    'topRoutes', coalesce((select jsonb_agg(row_to_json(r)) from (select path, count(*)::int as views, count(distinct session_id)::int as sessions from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days' group by path order by views desc limit 12) r), '[]'::jsonb),
    'topEvents', coalesce((select jsonb_agg(row_to_json(e)) from (select event_name as name, count(*)::int as value from public.analytics_events where occurred_at >= now() - interval '30 days' group by event_name order by value desc) e), '[]'::jsonb),
    'hourly', coalesce((select jsonb_agg(row_to_json(h) order by hour) from (select extract(hour from occurred_at)::int as hour, count(*)::int as events, count(distinct session_id)::int as sessions from public.analytics_events where occurred_at >= now() - interval '30 days' group by 1) h), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(row_to_json(d)) from (select case when viewport_width < 768 then 'Mobile' when viewport_width < 1200 then 'Tablet' else 'Desktop' end as name, count(*)::int as value from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days' and viewport_width is not null group by 1 order by value desc) d), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(row_to_json(r)) from (select coalesce(nullif(referrer_host, ''), 'Direct') as name, count(*)::int as value from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days' group by 1 order by value desc limit 8) r), '[]'::jsonb),
    'funnel', jsonb_build_array(
      jsonb_build_object('name','Visitors','value',(select count(distinct session_id) from public.analytics_events where occurred_at >= now() - interval '30 days')),
      jsonb_build_object('name','Signup started','value',(select count(distinct session_id) from public.analytics_events where event_name='signup_started' and occurred_at >= now() - interval '30 days')),
      jsonb_build_object('name','Signup complete','value',(select count(distinct session_id) from public.analytics_events where event_name='signup_completed' and occurred_at >= now() - interval '30 days')),
      jsonb_build_object('name','Requirements','value',(select count(distinct session_id) from public.analytics_events where event_name='requirement_published' and occurred_at >= now() - interval '30 days')),
      jsonb_build_object('name','Projects','value',(select count(distinct session_id) from public.analytics_events where event_name='project_created' and occurred_at >= now() - interval '30 days'))
    ),
    'daily', coalesce((select jsonb_agg(row_to_json(d) order by day) from (select occurred_at::date as day, count(*) filter (where event_name='page_view')::int as views, count(distinct session_id)::int as sessions, count(distinct account_id) filter (where account_id is not null)::int as active_users from public.analytics_events where occurred_at >= current_date - 29 group by occurred_at::date) d), '[]'::jsonb)
  ) else null end;
$$;

revoke execute on function public.admin_analytics_summary() from public, anon;
grant execute on function public.admin_analytics_summary() to authenticated;
