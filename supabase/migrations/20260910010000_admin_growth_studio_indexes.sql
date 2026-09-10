create index if not exists platform_contact_settings_updated_by_idx
  on public.platform_contact_settings(updated_by)
  where updated_by is not null;

create index if not exists seo_generation_jobs_requested_by_idx
  on public.seo_generation_jobs(requested_by);
