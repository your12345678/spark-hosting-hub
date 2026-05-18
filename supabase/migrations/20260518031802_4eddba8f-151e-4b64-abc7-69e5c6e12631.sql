grant usage on schema public to anon, authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.has_role(uuid, app_role) to anon;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = 'admin@gmail.com'
on conflict (user_id, role) do nothing;