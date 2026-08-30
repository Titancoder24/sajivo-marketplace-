create or replace function public.admin_analytics_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select case when public.is_platform_admin('analyst') then jsonb_build_object(
    'dau', (select count(distinct account_id) from public.analytics_events where account_id is not null and occurred_at >= now() - interval '1 day'),
    'mau', (select count(distinct account_id) from public.analytics_events where account_id is not null and occurred_at >= now() - interval '30 days'),
    'sessions24h', (select count(distinct session_id) from public.analytics_events where occurred_at >= now() - interval '1 day'),
    'sessions30d', (select count(distinct session_id) from public.analytics_events where occurred_at >= now() - interval '30 days'),
    'pageViews24h', (select count(*) from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '1 day'),
    'pageViews30d', (select count(*) from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days'),
    'topRoutes', coalesce((select jsonb_agg(row_to_json(r)) from (select path, count(*)::int as views, count(distinct session_id)::int as sessions from public.analytics_events where event_name = 'page_view' and occurred_at >= now() - interval '30 days' group by path order by views desc limit 12) r), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(row_to_json(d) order by day) from (select occurred_at::date as day, count(*) filter (where event_name='page_view')::int as views, count(distinct session_id)::int as sessions, count(distinct account_id) filter (where account_id is not null)::int as active_users from public.analytics_events where occurred_at >= current_date - 29 group by occurred_at::date) d), '[]'::jsonb)
  ) else null end;
$$;

create or replace function public.admin_heatmap_summary(target_path text default null)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select case when public.is_platform_admin('analyst') then coalesce((
    select jsonb_agg(row_to_json(h) order by clicks desc)
    from (
      select path,
        least(9, greatest(0, floor(((metadata->>'x_pct')::numeric) * 10)::int)) as x_bucket,
        least(9, greatest(0, floor(((metadata->>'y_pct')::numeric) * 10)::int)) as y_bucket,
        count(*)::int as clicks
      from public.analytics_events
      where event_name = 'ui_click'
        and occurred_at >= now() - interval '30 days'
        and metadata ? 'x_pct' and metadata ? 'y_pct'
        and (target_path is null or path = target_path)
      group by path, x_bucket, y_bucket
      order by clicks desc
      limit 200
    ) h
  ), '[]'::jsonb) else null end;
$$;

revoke execute on function public.admin_analytics_summary() from public, anon;
revoke execute on function public.admin_heatmap_summary(text) from public, anon;
grant execute on function public.admin_analytics_summary(), public.admin_heatmap_summary(text) to authenticated;
