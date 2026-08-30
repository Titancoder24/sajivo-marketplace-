create or replace function public.guard_profile_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) = old.id and (
    new.primary_role is distinct from old.primary_role or
    new.roles is distinct from old.roles or
    new.account_type is distinct from old.account_type or
    new.business_account_type is distinct from old.business_account_type or
    new.business_role is distinct from old.business_role or
    new.account_status is distinct from old.account_status or
    new.verification_status is distinct from old.verification_status or
    new.person_public_id is distinct from old.person_public_id or
    new.account_public_id is distinct from old.account_public_id
  ) then
    raise exception 'Authorization and verification fields can only be changed by Sajivo administration';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_profile_authorization_fields() from public, anon, authenticated;
drop trigger if exists guard_profile_authorization_fields on public.profiles;
create trigger guard_profile_authorization_fields before update on public.profiles for each row execute function public.guard_profile_authorization_fields();
