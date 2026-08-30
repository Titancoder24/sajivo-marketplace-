create or replace function public.sajivo_public_id(prefix text)
returns text
language sql
volatile
set search_path = ''
as $$
  select upper(prefix || '-' || substr(pg_catalog.encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
$$;
