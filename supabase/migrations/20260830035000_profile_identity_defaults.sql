alter table public.profiles
  alter column person_public_id set default public.sajivo_public_id('PER'),
  alter column account_public_id set default public.sajivo_public_id('ACC');

