-- Auth users created before the on_auth_user_created trigger get a profile too.
-- They start as pending clients, like any new sign-up.
insert into public.profiles (id, email, full_name)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
