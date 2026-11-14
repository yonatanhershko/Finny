-- Settings, categories, transactions, recurring rules, goals.
-- Money is bigint minor units, always positive. Rules: docs/spec.md, .claude/rules/money.md
-- Every table: RLS on, own rows only, and only while the account has access.

create type public.transaction_type as enum ('income', 'expense');
create type public.repeat_kind as enum ('recurring', 'installments');
create type public.repeat_frequency as enum ('weekly', 'monthly', 'yearly');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  currency text not null default 'ILS' check (currency in ('ILS', 'USD')),
  -- budget month starts on this day; shorter months use their last day
  month_start_day smallint not null default 1 check (month_start_day between 1 and 31),
  overall_budget bigint check (overall_budget > 0),
  daily_reminder_enabled boolean not null default false,
  daily_reminder_time time not null default '20:00',
  purchase_notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type public.transaction_type not null,
  -- a default category keeps name null and shows a translated name from default_key
  name text check (name is null or char_length(trim(name)) between 1 and 40),
  default_key text,
  icon text not null default 'tag',
  color text not null default '#8A9099' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  monthly_budget bigint check (monthly_budget > 0),
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_has_a_name check (name is not null or default_key is not null),
  constraint categories_budget_only_for_expense check (monthly_budget is null or type = 'expense'),
  unique (id, user_id)
);

create index categories_user_idx on public.categories (user_id, type, sort_order);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind public.repeat_kind not null,
  type public.transaction_type not null,
  category_id uuid not null,
  description text not null default '' check (char_length(description) <= 200),
  -- recurring: amount of each occurrence. installments: the full total.
  amount bigint not null check (amount > 0),
  frequency public.repeat_frequency not null default 'monthly',
  start_date date not null,
  end_date date,
  installments_count integer check (installments_count between 2 and 120),
  occurrences_generated integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recurring_rules_category_fk foreign key (category_id, user_id)
    references public.categories (id, user_id),
  constraint recurring_rules_shape check (
    (kind = 'installments' and installments_count is not null and frequency = 'monthly')
    or (kind = 'recurring' and installments_count is null)
  ),
  constraint recurring_rules_dates check (end_date is null or end_date >= start_date)
);

create index recurring_rules_user_idx on public.recurring_rules (user_id) where active;
create index recurring_rules_category_idx on public.recurring_rules (category_id, user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type public.transaction_type not null,
  amount bigint not null check (amount > 0),
  description text not null default '' check (char_length(description) <= 200),
  date date not null default current_date,
  category_id uuid not null,
  recurring_rule_id uuid references public.recurring_rules (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transactions_category_fk foreign key (category_id, user_id)
    references public.categories (id, user_id)
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_idx on public.transactions (category_id, user_id);
create index transactions_rule_idx on public.transactions (recurring_rule_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  target_amount bigint not null check (target_amount > 0),
  icon text not null default 'flag',
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index goals_user_idx on public.goals (user_id);

-- Money set aside for a goal. Separate from transactions: never an expense.
create table public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  goal_id uuid not null,
  amount bigint not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint goal_deposits_goal_fk foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade
);

create index goal_deposits_goal_idx on public.goal_deposits (goal_id, user_id);
create index goal_deposits_user_idx on public.goal_deposits (user_id);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: own rows, and only with access
-- ---------------------------------------------------------------------------

alter table public.user_settings enable row level security;
alter table public.categories enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.goal_deposits enable row level security;

create policy "user_settings: own with access" on public.user_settings for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "categories: own with access" on public.categories for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "recurring_rules: own with access" on public.recurring_rules for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "transactions: own with access" on public.transactions for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "goals: own with access" on public.goals for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "goal_deposits: own with access" on public.goal_deposits for all to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

revoke all on public.user_settings, public.categories, public.recurring_rules,
  public.transactions, public.goals, public.goal_deposits from anon;
-- settings rows are created by the system; a client edits, never inserts or deletes
revoke insert, delete on public.user_settings from authenticated;

-- ---------------------------------------------------------------------------
-- Defaults for every account
-- ---------------------------------------------------------------------------

create function public.seed_user_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.categories where user_id = p_user_id) then
    insert into public.categories (user_id, type, default_key, icon, color, sort_order) values
      (p_user_id, 'expense', 'car',      'car',                   '#5B9BD5', 1),
      (p_user_id, 'expense', 'food',     'silverware-fork-knife', '#E8A87C', 2),
      (p_user_id, 'expense', 'leisure',  'gift',                  '#E07A8B', 3),
      (p_user_id, 'expense', 'housing',  'home',                  '#9B8AD6', 4),
      (p_user_id, 'expense', 'health',   'heart-pulse',           '#6FB7B0', 5),
      (p_user_id, 'expense', 'shopping', 'shopping',              '#F2C94C', 6),
      (p_user_id, 'expense', 'bills',    'receipt',               '#B58A5A', 7),
      (p_user_id, 'expense', 'other',    'dots-horizontal',       '#8A9099', 8),
      (p_user_id, 'income',  'salary',   'cash-multiple',         '#4A7C6F', 1),
      (p_user_id, 'income',  'other',    'plus-circle',           '#8FBF6B', 2);
  end if;
end;
$$;

create function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_user_defaults(new.id);
  return new;
end;
$$;

create trigger on_profile_created
after insert on public.profiles
for each row execute function public.handle_new_profile();

select public.seed_user_defaults(id) from public.profiles;

-- ---------------------------------------------------------------------------
-- Repeating transactions
-- ---------------------------------------------------------------------------

-- Date of the n-th (0-based) occurrence, always counted from the first date
-- so a rule that starts on the 31st stays on month ends.
create function public.occurrence_date(p_first date, p_frequency public.repeat_frequency, p_n integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_frequency
    when 'weekly' then p_first + (p_n * 7)
    when 'monthly' then (p_first + make_interval(months => p_n))::date
    else (p_first + make_interval(years => p_n))::date
  end;
$$;

-- Creates the real transactions of the caller's recurring rules that are due
-- up to today. Runs as the caller, so RLS applies. Returns how many were added.
create function public.materialize_recurring()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  r public.recurring_rules;
  v_date date;
  v_n integer;
  v_added integer := 0;
begin
  for r in
    select * from public.recurring_rules
    where user_id = (select auth.uid()) and active and kind = 'recurring'
    for update
  loop
    v_n := r.occurrences_generated;
    loop
      v_date := public.occurrence_date(r.start_date, r.frequency, v_n);
      exit when v_date > current_date or (r.end_date is not null and v_date > r.end_date);
      -- safety stop: never more than 500 catch-up rows for one rule in one call
      exit when v_n - r.occurrences_generated >= 500;
      insert into public.transactions (user_id, type, amount, description, date, category_id, recurring_rule_id)
      values (r.user_id, r.type, r.amount, r.description, v_date, r.category_id, r.id);
      v_n := v_n + 1;
      v_added := v_added + 1;
    end loop;
    if v_n <> r.occurrences_generated then
      update public.recurring_rules set occurrences_generated = v_n where id = r.id;
    end if;
  end loop;
  return v_added;
end;
$$;

create function public.create_recurring(
  p_type public.transaction_type,
  p_category_id uuid,
  p_description text,
  p_amount bigint,
  p_frequency public.repeat_frequency,
  p_start_date date,
  p_end_date date default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.recurring_rules (kind, type, category_id, description, amount, frequency, start_date, end_date)
  values ('recurring', p_type, p_category_id, coalesce(p_description, ''), p_amount, p_frequency, p_start_date, p_end_date)
  returning id into v_id;
  perform public.materialize_recurring();
  return v_id;
end;
$$;

-- Splits a total into monthly payments. Each payment is floor(total / count);
-- the remainder goes on the first one, so the payments sum to the total exactly.
create function public.create_installments(
  p_type public.transaction_type,
  p_category_id uuid,
  p_description text,
  p_total bigint,
  p_count integer,
  p_first_date date
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_base bigint;
  v_remainder bigint;
begin
  if p_count is null or p_count < 2 or p_count > 120 then
    raise exception 'installments count must be 2-120' using errcode = 'P0001';
  end if;
  v_base := p_total / p_count;
  v_remainder := p_total - v_base * p_count;
  if v_base < 1 then
    raise exception 'total is too small for that many payments' using errcode = 'P0001';
  end if;

  insert into public.recurring_rules (kind, type, category_id, description, amount, frequency, start_date, installments_count, occurrences_generated, active)
  values ('installments', p_type, p_category_id, coalesce(p_description, ''), p_total, 'monthly', p_first_date, p_count, p_count, false)
  returning id into v_id;

  insert into public.transactions (type, amount, description, date, category_id, recurring_rule_id)
  select
    p_type,
    case when n = 0 then v_base + v_remainder else v_base end,
    coalesce(p_description, ''),
    public.occurrence_date(p_first_date, 'monthly', n),
    p_category_id,
    v_id
  from generate_series(0, p_count - 1) as n;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reads
-- ---------------------------------------------------------------------------

-- Sum per category for a date range. Runs as the caller, so RLS applies.
create function public.category_totals(p_from date, p_to date)
returns table (category_id uuid, type public.transaction_type, total bigint, count bigint)
language sql
stable
set search_path = ''
as $$
  select t.category_id, t.type, sum(t.amount)::bigint, count(*)
  from public.transactions t
  where t.user_id = (select auth.uid()) and t.date between p_from and p_to
  group by t.category_id, t.type;
$$;

-- Saved amount per goal.
create function public.goal_totals()
returns table (goal_id uuid, saved bigint)
language sql
stable
set search_path = ''
as $$
  select d.goal_id, sum(d.amount)::bigint
  from public.goal_deposits d
  where d.user_id = (select auth.uid())
  group by d.goal_id;
$$;

-- ---------------------------------------------------------------------------
-- Account deletion: removes the auth user; every row cascades from it.
-- ---------------------------------------------------------------------------

create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke execute on function public.seed_user_defaults(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_profile() from public, anon, authenticated;
revoke execute on function public.occurrence_date(date, public.repeat_frequency, integer) from public, anon;
revoke execute on function public.materialize_recurring() from public, anon;
revoke execute on function public.create_recurring(public.transaction_type, uuid, text, bigint, public.repeat_frequency, date, date) from public, anon;
revoke execute on function public.create_installments(public.transaction_type, uuid, text, bigint, integer, date) from public, anon;
revoke execute on function public.category_totals(date, date) from public, anon;
revoke execute on function public.goal_totals() from public, anon;
revoke execute on function public.delete_account() from public, anon;

grant execute on function public.occurrence_date(date, public.repeat_frequency, integer) to authenticated;
grant execute on function public.materialize_recurring() to authenticated;
grant execute on function public.create_recurring(public.transaction_type, uuid, text, bigint, public.repeat_frequency, date, date) to authenticated;
grant execute on function public.create_installments(public.transaction_type, uuid, text, bigint, integer, date) to authenticated;
grant execute on function public.category_totals(date, date) to authenticated;
grant execute on function public.goal_totals() to authenticated;
grant execute on function public.delete_account() to authenticated;
