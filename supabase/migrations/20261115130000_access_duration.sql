-- Admin picks how long access lasts on approve / renew / extend: 1 year (default) or 2 months.
-- (owner request 2026-11-15). Family has no expiry and ignores the duration.
-- The argument list changes, so the old functions are dropped and created again;
-- no data is touched.

drop function public.admin_approve_user(uuid, public.access_plan);
drop function public.admin_extend_user(uuid);

-- 12 months stays exactly 365 days, as before. 2 months is calendar months.
create function public.access_duration(p_months integer)
returns interval
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_months = 12 then
    return interval '365 days';
  elsif p_months = 2 then
    return interval '2 months';
  end if;
  raise exception 'duration must be 2 or 12 months' using errcode = '22023';
end;
$$;

create function public.admin_approve_user(
  p_user_id uuid,
  p_plan public.access_plan default 'paid',
  p_months integer default 12
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_old_expires timestamptz;
  v_new_expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  v_old_expires := v_profile.expires_at;
  v_new_expires := case
    when p_plan = 'family' then null
    else now() + public.access_duration(p_months)
  end;

  update public.profiles
  set status = 'active', plan = p_plan, approved_at = now(), expires_at = v_new_expires
  where id = p_user_id
  returning * into v_profile;

  insert into public.subscription_events (user_id, actor_id, action, plan, old_expires_at, new_expires_at)
  values (p_user_id, (select auth.uid()), 'approve', p_plan, v_old_expires, v_new_expires);

  return v_profile;
end;
$$;

-- Adds the duration: from the current expiry when it is still in the future,
-- otherwise from now. Also re-activates an expired account.
create function public.admin_extend_user(p_user_id uuid, p_months integer default 12)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_old_expires timestamptz;
  v_new_expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  if v_profile.plan is null or v_profile.status not in ('active', 'expired') then
    raise exception 'user was never approved; approve instead' using errcode = 'P0001';
  end if;
  if v_profile.plan = 'family' then
    raise exception 'family plan does not expire' using errcode = 'P0001';
  end if;

  v_old_expires := v_profile.expires_at;
  v_new_expires := greatest(coalesce(v_profile.expires_at, now()), now()) + public.access_duration(p_months);

  update public.profiles
  set status = 'active', expires_at = v_new_expires
  where id = p_user_id
  returning * into v_profile;

  insert into public.subscription_events (user_id, actor_id, action, plan, old_expires_at, new_expires_at)
  values (p_user_id, (select auth.uid()), 'extend', v_profile.plan, v_old_expires, v_new_expires);

  return v_profile;
end;
$$;

revoke execute on function public.access_duration(integer) from public, anon, authenticated;
revoke execute on function public.admin_approve_user(uuid, public.access_plan, integer) from public, anon;
revoke execute on function public.admin_extend_user(uuid, integer) from public, anon;
grant execute on function public.admin_approve_user(uuid, public.access_plan, integer) to authenticated;
grant execute on function public.admin_extend_user(uuid, integer) to authenticated;
