-- Renewal reminders by push. Rules: docs/spec.md "Notifications".
-- The phone registers its Expo push token; a daily job sends the reminders
-- straight to the Expo push service with pg_net. No secret is needed for that.

create extension if not exists pg_net with schema extensions;

-- One row per device. Language and the renewal switch live here, so the server
-- knows whether and in which language to send.
create table public.push_tokens (
  token text primary key check (char_length(token) between 20 and 200),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  language text not null default 'he' check (language in ('he', 'en')),
  subscription_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

-- What was already sent: one reminder per kind per expiry date.
create table public.notification_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('expiry_30', 'expiry_7', 'expiry_1', 'expiry_0')),
  expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, expires_at)
);

-- Both tables are reached only through the functions below (and the daily job).
-- RLS is on with no policy, so no client can read or write them directly.
alter table public.push_tokens enable row level security;
alter table public.notification_log enable row level security;
revoke all on public.push_tokens, public.notification_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Called by the app
-- ---------------------------------------------------------------------------

-- Saves this device's token for the signed-in user. A phone that changes
-- hands (another user signs in) moves its token to the new user.
create function public.register_push_token(
  p_token text,
  p_platform text,
  p_language text,
  p_subscription_reminders boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  if p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'invalid push token';
  end if;

  insert into public.push_tokens (token, user_id, platform, language, subscription_reminders)
  values (p_token, v_user, p_platform, p_language, p_subscription_reminders)
  on conflict (token) do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      language = excluded.language,
      subscription_reminders = excluded.subscription_reminders,
      updated_at = now();
end;
$$;

-- Sign-out: this device stops getting the user's reminders.
create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens
  where token = p_token and user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Daily job
-- ---------------------------------------------------------------------------

-- Sends the renewal reminders that are due today (Israel date): 30, 7 and 1
-- days before expiry, and on the expiry day. Returns how many pushes went out.
create function public.send_subscription_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_messages jsonb;
  v_total integer := 0;
  v_chunk jsonb;
  v_from integer := 0;
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
    'title', case t.language
      when 'en' then case f.kind
        when 'expiry_30' then 'Your Finny subscription ends in a month'
        when 'expiry_7' then 'Your Finny subscription ends in a week'
        when 'expiry_1' then 'Your Finny subscription ends tomorrow'
        else 'Your Finny subscription ends today' end
      else case f.kind
        when 'expiry_30' then 'המנוי ב-Finny מסתיים בעוד חודש'
        when 'expiry_7' then 'המנוי ב-Finny מסתיים בעוד שבוע'
        when 'expiry_1' then 'המנוי ב-Finny מסתיים מחר'
        else 'המנוי ב-Finny מסתיים היום' end
      end,
    'body', case t.language
      when 'en' then case f.kind
        when 'expiry_0' then 'Your data is kept. Renew to keep using the app.'
        else 'Renew in time and keep tracking without a break.' end
      else case f.kind
        when 'expiry_0' then 'הנתונים שלך נשמרים. חדש את המנוי כדי להמשיך להשתמש.'
        else 'כדאי לחדש בזמן ולהמשיך לעקוב בלי הפסקה.' end
      end,
    'sound', 'default',
    'channelId', 'default',
    'data', jsonb_build_object('url', '/renew')
  )), '[]'::jsonb)
  into v_messages
  from fresh f
  join public.push_tokens t on t.user_id = f.user_id
  where t.subscription_reminders;

  v_total := jsonb_array_length(v_messages);

  -- The Expo push service takes at most 100 messages per request.
  while v_from < v_total loop
    select jsonb_agg(m.value order by m.ordinality) into v_chunk
    from jsonb_array_elements(v_messages) with ordinality as m
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

revoke execute on function public.send_subscription_reminders() from public, anon, authenticated;
revoke execute on function public.register_push_token(text, text, text, boolean) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text, text, boolean) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- Every day at 08:00 UTC (10:00 in Israel in winter, 11:00 in summer).
select cron.schedule(
  'finny-subscription-reminders',
  '0 8 * * *',
  $$select public.send_subscription_reminders()$$
);
