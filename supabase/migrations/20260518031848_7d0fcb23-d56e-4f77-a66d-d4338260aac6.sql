drop function if exists public.claim_first_admin();

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

revoke all on function public.has_role(uuid, app_role) from public;
revoke all on function public.has_role(uuid, app_role) from anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;

drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);