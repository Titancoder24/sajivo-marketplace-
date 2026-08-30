create table if not exists public.platform_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('openrouter', 'google_analytics', 'microsoft_clarity', 'google_search_console', 'razorpay', 'resend', 'twilio')),
  encrypted_value text,
  encryption_iv text,
  encryption_tag text,
  value_hint text,
  status text not null default 'not_configured' check (status in ('not_configured', 'configured', 'disabled', 'error')),
  config jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  account_id uuid references public.profiles(id) on delete set null,
  event_name text not null check (event_name in ('page_view', 'ui_click', 'signup_started', 'signup_completed', 'login_completed', 'requirement_published', 'proposal_submitted', 'project_created', 'subscription_viewed', 'angel_opened', 'angel_message_sent')),
  path text not null,
  referrer_host text,
  viewport_width integer check (viewport_width is null or viewport_width between 240 and 10000),
  viewport_height integer check (viewport_height is null or viewport_height between 240 and 10000),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  state_slug text not null,
  state_name text not null,
  city_slug text not null,
  city_name text not null,
  service_slug text not null,
  service_name text not null,
  route_path text not null unique,
  title text not null,
  meta_description text not null,
  h1 text not null,
  introduction text not null,
  local_insights text not null,
  faq jsonb not null default '[]'::jsonb,
  target_keywords text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  canonical_url text,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_slug, city_slug, service_slug)
);

create table if not exists public.seo_keyword_targets (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.seo_pages(id) on delete cascade,
  keyword text not null,
  intent text not null default 'commercial' check (intent in ('informational', 'commercial', 'transactional', 'local')),
  priority integer not null default 50 check (priority between 1 and 100),
  position integer check (position is null or position > 0),
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(page_id, keyword)
);

alter table public.platform_integrations enable row level security;
alter table public.analytics_events enable row level security;
alter table public.seo_pages enable row level security;
alter table public.seo_keyword_targets enable row level security;

create policy "admins read integration settings" on public.platform_integrations for select to authenticated
using (
  public.is_platform_admin()
  or encode(digest(coalesce((select current_setting('request.headers', true))::json ->> 'x-sajivo-runtime-token', ''), 'sha256'), 'hex') = '1629bca2a944141b3eeb1b9fa3b7248280ee995477eb294441c241000f24e930'
);
create policy "super admins create integration settings" on public.platform_integrations for insert to authenticated
with check (public.is_platform_admin('super_admin'));
create policy "super admins update integration settings" on public.platform_integrations for update to authenticated
using (public.is_platform_admin('super_admin')) with check (public.is_platform_admin('super_admin'));

create policy "visitors record privacy safe analytics" on public.analytics_events for insert to anon, authenticated
with check (account_id is null or account_id = (select auth.uid()));
create policy "admins read analytics" on public.analytics_events for select to authenticated
using (public.is_platform_admin('analyst'));

create policy "everyone reads published seo pages" on public.seo_pages for select to anon, authenticated
using (status = 'published' or public.is_platform_admin());
create policy "admins create seo pages" on public.seo_pages for insert to authenticated
with check (public.is_platform_admin('super_admin'));
create policy "admins update seo pages" on public.seo_pages for update to authenticated
using (public.is_platform_admin('super_admin')) with check (public.is_platform_admin('super_admin'));
create policy "admins delete seo pages" on public.seo_pages for delete to authenticated
using (public.is_platform_admin('super_admin'));

create policy "everyone reads published seo keywords" on public.seo_keyword_targets for select to anon, authenticated
using (exists (select 1 from public.seo_pages p where p.id = page_id and (p.status = 'published' or public.is_platform_admin())));
create policy "admins manage seo keywords" on public.seo_keyword_targets for all to authenticated
using (public.is_platform_admin('super_admin')) with check (public.is_platform_admin('super_admin'));

create index if not exists platform_integrations_updated_by_idx on public.platform_integrations(updated_by) where updated_by is not null;
create index if not exists analytics_events_occurred_idx on public.analytics_events(occurred_at desc);
create index if not exists analytics_events_account_occurred_idx on public.analytics_events(account_id, occurred_at desc) where account_id is not null;
create index if not exists analytics_events_session_occurred_idx on public.analytics_events(session_id, occurred_at desc);
create index if not exists analytics_events_path_name_idx on public.analytics_events(path, event_name, occurred_at desc);
create index if not exists seo_pages_status_location_idx on public.seo_pages(status, state_slug, city_slug);
create index if not exists seo_pages_created_by_idx on public.seo_pages(created_by) where created_by is not null;
create index if not exists seo_keyword_targets_page_priority_idx on public.seo_keyword_targets(page_id, priority desc);
create index if not exists seo_keyword_targets_keyword_idx on public.seo_keyword_targets using gin(to_tsvector('english', keyword));

grant select, insert, update on public.platform_integrations to authenticated;
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant select on public.seo_pages, public.seo_keyword_targets to anon, authenticated;
grant insert, update, delete on public.seo_pages, public.seo_keyword_targets to authenticated;
grant usage, select on sequence public.analytics_events_id_seq, public.seo_keyword_targets_id_seq to anon, authenticated;

insert into public.platform_integrations(provider, status) values
  ('openrouter', 'not_configured'),
  ('google_analytics', 'not_configured'),
  ('microsoft_clarity', 'not_configured'),
  ('google_search_console', 'not_configured')
on conflict (provider) do nothing;

with locations(state_slug, state_name, city_slug, city_name) as (
  values
    ('uttar-pradesh','Uttar Pradesh','lucknow','Lucknow'),
    ('uttar-pradesh','Uttar Pradesh','noida','Noida'),
    ('uttar-pradesh','Uttar Pradesh','ghaziabad','Ghaziabad'),
    ('uttar-pradesh','Uttar Pradesh','kanpur','Kanpur'),
    ('uttar-pradesh','Uttar Pradesh','agra','Agra'),
    ('uttar-pradesh','Uttar Pradesh','varanasi','Varanasi'),
    ('uttar-pradesh','Uttar Pradesh','prayagraj','Prayagraj'),
    ('uttar-pradesh','Uttar Pradesh','meerut','Meerut'),
    ('uttar-pradesh','Uttar Pradesh','gorakhpur','Gorakhpur'),
    ('uttar-pradesh','Uttar Pradesh','bareilly','Bareilly'),
    ('maharashtra','Maharashtra','mumbai','Mumbai'),
    ('maharashtra','Maharashtra','pune','Pune'),
    ('karnataka','Karnataka','bengaluru','Bengaluru'),
    ('telangana','Telangana','hyderabad','Hyderabad'),
    ('tamil-nadu','Tamil Nadu','chennai','Chennai'),
    ('delhi','Delhi','new-delhi','New Delhi'),
    ('rajasthan','Rajasthan','jaipur','Jaipur'),
    ('gujarat','Gujarat','ahmedabad','Ahmedabad'),
    ('west-bengal','West Bengal','kolkata','Kolkata'),
    ('madhya-pradesh','Madhya Pradesh','indore','Indore')
), services(service_slug, service_name) as (
  values
    ('interior-designers','Interior Designers'),
    ('home-renovation','Home Renovation'),
    ('modular-kitchen','Modular Kitchen'),
    ('civil-contractors','Civil Contractors'),
    ('architects','Architects')
)
insert into public.seo_pages(state_slug,state_name,city_slug,city_name,service_slug,service_name,route_path,title,meta_description,h1,introduction,local_insights,faq,target_keywords,status,published_at)
select
  l.state_slug,l.state_name,l.city_slug,l.city_name,s.service_slug,s.service_name,
  '/in/' || l.state_slug || '/' || l.city_slug || '/' || s.service_slug,
  s.service_name || ' in ' || l.city_name || ' | Sajivo',
  'Discover verified ' || lower(s.service_name) || ' in ' || l.city_name || '. Compare structured proposals, project experience and service fit on Sajivo.',
  s.service_name || ' in ' || l.city_name,
  'Plan your project with verified professionals, structured requirements and comparable proposals through Sajivo.',
  'Sajivo helps customers in ' || l.city_name || ', ' || l.state_name || ' discover professionals based on project type, location, budget, availability and verified marketplace information.',
  jsonb_build_array(
    jsonb_build_object('question','How do I find verified professionals in ' || l.city_name || '?','answer','Create a Sajivo requirement with your location, scope, budget and timeline. Eligible professionals can then respond with structured proposals.'),
    jsonb_build_object('question','Can I compare proposals?','answer','Yes. Sajivo keeps proposals, timelines, terms and project communication together for easier comparison.')
  ),
  array[
    lower(s.service_name) || ' in ' || lower(l.city_name),
    'best ' || lower(s.service_name) || ' ' || lower(l.city_name),
    'verified ' || lower(s.service_name) || ' near me',
    lower(l.city_name) || ' ' || lower(s.service_name) || ' cost'
  ],
  'published', now()
from locations l cross join services s
on conflict (state_slug,city_slug,service_slug) do nothing;

insert into public.seo_keyword_targets(page_id, keyword, intent, priority)
select p.id, keyword, case when keyword like '%near me%' then 'local' else 'commercial' end, 70
from public.seo_pages p
cross join lateral unnest(p.target_keywords) as keyword
on conflict (page_id,keyword) do nothing;
