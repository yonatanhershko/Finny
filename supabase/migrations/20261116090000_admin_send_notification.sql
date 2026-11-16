-- Admin sends a notification by hand: to one active user or to all active users.
-- Rules: docs/spec.md "Notifications" -> "Manual send".
-- A manual send resets nothing: it is not written to notification_log and does
-- not touch the automatic reminders.

-- One place for the server-side texts. The inactivity texts mirror
-- apps/mobile/src/i18n/{he,en}.json -> notifications.inactive (the phone
-- schedules those itself; here they exist for the manual send).
create function public.notification_text(p_kind text, p_language text)
returns table (title text, body text)
language sql
immutable
set search_path = ''
as $$
  select t.title, t.body
  from (values
    ('expiry_30', 'he', 'המנוי ב-Finny מסתיים בעוד חודש', 'כדאי לחדש בזמן ולהמשיך לעקוב בלי הפסקה.'),
    ('expiry_7',  'he', 'המנוי ב-Finny מסתיים בעוד שבוע', 'כדאי לחדש בזמן ולהמשיך לעקוב בלי הפסקה.'),
    ('expiry_1',  'he', 'המנוי ב-Finny מסתיים מחר', 'כדאי לחדש בזמן ולהמשיך לעקוב בלי הפסקה.'),
    ('expiry_0',  'he', 'המנוי ב-Finny מסתיים היום', 'הנתונים שלך נשמרים. חדש את המנוי כדי להמשיך להשתמש.'),
    ('inactive_1', 'he', 'איפה נעלמת? 🌱', 'כמה ימים בלי מעקב. דקה אחת עכשיו, ועתיד כלכלי טוב יותר אחר כך.'),
    ('inactive_2', 'he', 'הארנק מתגעגע', 'רישום קצר של ההוצאות וההכנסות מחזיר אותך לשליטה.'),
    ('inactive_3', 'he', 'צעד קטן, הרגל גדול', 'מעקב קבוע הוא הדרך לעתיד כלכלי טוב יותר. נמשיך?'),
    ('expiry_30', 'en', 'Your Finny subscription ends in a month', 'Renew in time and keep tracking without a break.'),
    ('expiry_7',  'en', 'Your Finny subscription ends in a week', 'Renew in time and keep tracking without a break.'),
    ('expiry_1',  'en', 'Your Finny subscription ends tomorrow', 'Renew in time and keep tracking without a break.'),
    ('expiry_0',  'en', 'Your Finny subscription ends today', 'Your data is kept. Renew to keep using the app.'),
    ('inactive_1', 'en', 'Where did you go? 🌱', 'A few days without tracking. One minute now, a better financial future later.'),
    ('inactive_2', 'en', 'Your wallet misses you', 'A quick log of spending and income puts you back in control.'),
    ('inactive_3', 'en', 'Small step, big habit', 'Steady tracking is the way to a better financial future. Shall we?')
  ) as t (kind, language, title, body)
  where t.kind = p_kind and t.language = p_language;
$$;

-- Posts messages to the Expo push service, 100 per request (its limit).
create function public.post_push_messages(p_messages jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer := coalesce(jsonb_array_length(p_messages), 0);
  v_chunk jsonb;
  v_from integer := 0;
begin
  while v_from < v_total loop
    select jsonb_agg(m.value order by m.ordinality) into v_chunk
    from jsonb_array_elements(p_messages) with ordinality as m
    where m.ordinality > v_from and m.ordinality <= v_from + 100;

    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_chunk,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
    v_from := v_from + 100;
  end loop;
  return v_total;
end;
$$;

-- Same behaviour as before; now reads its texts from notification_text.
create or replace function public.send_subscription_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_messages jsonb;
begin
  with due as (
    select
      p.id,
      p.status,
      p.expires_at,
      (p.expires_at at time zone 'Asia/Jerusalem')::date
        - (now() at time zone 'Asia/Jerusalem')::date as days_left
    from public.profiles p
    where p.expires_at is not null and p.status in ('active', 'expired')
  ), fresh as (
    insert into public.notification_log (user_id, kind, expires_at)
    select id, 'expiry_' || days_left, expires_at
    from due
    where (status = 'active' and days_left in (30, 7, 1, 0))
       or (status = 'expired' and days_left = 0)
    on conflict do nothing
    returning user_id, kind
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', x.title,
    'body', x.body,
    'sound', 'default',
    'channelId', 'default',
    'data', jsonb_build_object('url', '/renew')
  )), '[]'::jsonb)
  into v_messages
  from fresh f
  join public.push_tokens t on t.user_id = f.user_id
  cross join lateral public.notification_text(f.kind, t.language) x
  where t.subscription_reminders;

  return public.post_push_messages(v_messages);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

-- The ready-made notifications, for the admin dropdown and its preview.
create function public.admin_notification_catalog()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return (
    select json_agg(json_build_object(
      'kind', k.kind,
      'he', (select row_to_json(x) from public.notification_text(k.kind, 'he') x),
      'en', (select row_to_json(x) from public.notification_text(k.kind, 'en') x)
    ) order by k.position)
    from unnest(array[
      'expiry_30', 'expiry_7', 'expiry_1', 'expiry_0', 'inactive_1', 'inactive_2', 'inactive_3'
    ]) with ordinality as k (kind, position)
  );
end;
$$;

-- Who a manual send would reach: one active user, or all active users (null).
create function public.admin_push_audience(p_user_id uuid default null)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'users', count(distinct p.id),
      'users_with_device', count(distinct t.user_id),
      'devices', count(t.token),
      'renewal_off_devices', count(t.token) filter (where not t.subscription_reminders)
    )
    from public.profiles p
    left join public.push_tokens t on t.user_id = p.id
    where p.status = 'active' and (p_user_id is null or p.id = p_user_id)
  );
end;
$$;

-- Sends now. p_user_id null = every active user. p_kind is a ready-made kind
-- or 'custom' (then p_title and p_body are the admin's own one-time text, sent
-- as written to every device). The user's switches are not checked: this is a
-- deliberate act by the admin. Returns how many devices it was sent to.
create function public.admin_send_notification(
  p_user_id uuid,
  p_kind text,
  p_title text default null,
  p_body text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_body text := nullif(trim(coalesce(p_body, '')), '');
  v_messages jsonb;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_kind = 'custom' then
    if v_title is null or v_body is null then
      raise exception 'A custom notification needs a title and a message';
    end if;
    if char_length(v_title) > 60 or char_length(v_body) > 200 then
      raise exception 'Title is at most 60 characters, message at most 200';
    end if;
  elsif not exists (select 1 from public.notification_text(p_kind, 'en')) then
    raise exception 'Unknown notification kind';
  end if;

  if p_user_id is not null and not exists (
    select 1 from public.profiles where id = p_user_id and status = 'active'
  ) then
    raise exception 'User is not active';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', coalesce(x.title, v_title),
    'body', coalesce(x.body, v_body),
    'sound', 'default',
    'channelId', 'default',
    'data', jsonb_build_object('url', case when p_kind like 'expiry_%' then '/renew' else '/today' end)
  )), '[]'::jsonb)
  into v_messages
  from public.profiles p
  join public.push_tokens t on t.user_id = p.id
  left join lateral public.notification_text(p_kind, t.language) x on true
  where p.status = 'active' and (p_user_id is null or p.id = p_user_id);

  return public.post_push_messages(v_messages);
end;
$$;

revoke execute on function public.notification_text(text, text) from public, anon, authenticated;
revoke execute on function public.post_push_messages(jsonb) from public, anon, authenticated;
revoke execute on function public.send_subscription_reminders() from public, anon, authenticated;
revoke execute on function public.admin_notification_catalog() from public, anon;
revoke execute on function public.admin_push_audience(uuid) from public, anon;
revoke execute on function public.admin_send_notification(uuid, text, text, text) from public, anon;
grant execute on function public.admin_notification_catalog() to authenticated;
grant execute on function public.admin_push_audience(uuid) to authenticated;
grant execute on function public.admin_send_notification(uuid, text, text, text) to authenticated;
