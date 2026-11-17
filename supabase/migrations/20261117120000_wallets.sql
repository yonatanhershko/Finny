-- Wallets: up to 4 separate books per user (personal, business, ...).
-- Rules: docs/spec.md "Wallets". Nothing is dropped; existing rows move into a
-- first "personal" wallet per user.
--
-- Every money row gets wallet_id. A composite FK (wallet_id, user_id) makes sure
-- the wallet belongs to the same user as the row, and RLS already pins user_id to
-- the caller, so no RLS change is needed on the money tables.
-- Transactions, recurring rules and deposits take their wallet from their category
-- or goal when the client does not send one (also keeps older app builds working).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- a default wallet keeps name null and shows a translated name from default_key
  name text check (name is null or char_length(trim(name)) between 1 and 30),
  default_key text check (default_key is null or default_key = 'personal'),
  color text not null default '#4A7C6F' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text not null default 'wallet-outline' check (char_length(icon) between 1 and 60),
  sort_order integer not null default 0,
  -- budget month starts on this day; shorter months use their last day
  month_start_day smallint not null default 1 check (month_start_day between 1 and 31),
  overall_budget bigint check (overall_budget > 0),
  created_at timestamptz not null default now(),
  constraint wallets_has_a_name check (name is not null or default_key is not null),
  unique (id, user_id)
);

create index wallets_user_idx on public.wallets (user_id, sort_order);

-- At most 4 wallets per user, whatever inserts them. The advisory lock makes two
-- inserts at the same moment count one after the other.
create function public.enforce_wallet_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('wallets:' || new.user_id::text, 0));
  if (select count(*) from public.wallets where user_id = new.user_id) >= 4 then
    raise exception 'wallet_limit' using errcode = 'P0001', hint = 'A user can have up to 4 wallets.';
  end if;
  return new;
end;
$$;

create trigger wallets_limit
before insert on public.wallets
for each row execute function public.enforce_wallet_limit();

-- ---------------------------------------------------------------------------
-- First wallet for every existing user, with their current month start and budget
-- ---------------------------------------------------------------------------

insert into public.wallets (user_id, default_key, sort_order, month_start_day, overall_budget)
select p.id, 'personal', 0, coalesce(s.month_start_day, 1), s.overall_budget
from public.profiles p
left join public.user_settings s on s.user_id = p.id
where not exists (select 1 from public.wallets w where w.user_id = p.id);

comment on column public.user_settings.month_start_day is 'Unused since wallets (20261117120000). Per wallet: wallets.month_start_day.';
comment on column public.user_settings.overall_budget is 'Unused since wallets (20261117120000). Per wallet: wallets.overall_budget.';

-- ---------------------------------------------------------------------------
-- wallet_id on every money table
-- ---------------------------------------------------------------------------

alter table public.categories add column wallet_id uuid;
alter table public.recurring_rules add column wallet_id uuid;
alter table public.transactions add column wallet_id uuid;
alter table public.goals add column wallet_id uuid;
alter table public.goal_deposits add column wallet_id uuid;

-- Each user has exactly one wallet at this point.
update public.categories t set wallet_id = w.id from public.wallets w where w.user_id = t.user_id;
update public.recurring_rules t set wallet_id = w.id from public.wallets w where w.user_id = t.user_id;
update public.transactions t set wallet_id = w.id from public.wallets w where w.user_id = t.user_id;
update public.goals t set wallet_id = w.id from public.wallets w where w.user_id = t.user_id;
update public.goal_deposits t set wallet_id = w.id from public.wallets w where w.user_id = t.user_id;

alter table public.categories alter column wallet_id set not null;
alter table public.recurring_rules alter column wallet_id set not null;
alter table public.transactions alter column wallet_id set not null;
alter table public.goals alter column wallet_id set not null;
alter table public.goal_deposits alter column wallet_id set not null;

-- The wallet belongs to the row's user. Deleting a wallet deletes its rows.
alter table public.categories add constraint categories_wallet_fk
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade;
alter table public.recurring_rules add constraint recurring_rules_wallet_fk
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade;
alter table public.transactions add constraint transactions_wallet_fk
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade;
alter table public.goals add constraint goals_wallet_fk
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade;
alter table public.goal_deposits add constraint goal_deposits_wallet_fk
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade;

-- A transaction or rule uses a category of its own wallet; a deposit, a goal of its own wallet.
alter table public.categories add constraint categories_id_wallet_key unique (id, wallet_id);
alter table public.goals add constraint goals_id_wallet_key unique (id, wallet_id);
alter table public.transactions add constraint transactions_category_wallet_fk
  foreign key (category_id, wallet_id) references public.categories (id, wallet_id);
alter table public.recurring_rules add constraint recurring_rules_category_wallet_fk
  foreign key (category_id, wallet_id) references public.categories (id, wallet_id);
alter table public.goal_deposits add constraint goal_deposits_goal_wallet_fk
  foreign key (goal_id, wallet_id) references public.goals (id, wallet_id) on delete cascade;

create index categories_wallet_idx on public.categories (wallet_id, type, sort_order);
create index recurring_rules_wallet_idx on public.recurring_rules (wallet_id);
create index transactions_wallet_date_idx on public.transactions (wallet_id, date desc);
create index transactions_category_wallet_idx on public.transactions (category_id, wallet_id);
create index goals_wallet_idx on public.goals (wallet_id);
create index goal_deposits_wallet_date_idx on public.goal_deposits (wallet_id, date);
create index goal_deposits_goal_wallet_idx on public.goal_deposits (goal_id, wallet_id);

-- ---------------------------------------------------------------------------
-- Fill wallet_id when the client leaves it out
-- ---------------------------------------------------------------------------

-- The user's first wallet, for categories and goals sent without one.
create function public.first_wallet_of(p_user_id uuid)
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.wallets where user_id = p_user_id order by sort_order, created_at limit 1;
$$;

create function public.fill_wallet_from_first()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.wallet_id is null then
    select w.id into new.wallet_id from public.wallets w
    where w.user_id = new.user_id order by w.sort_order, w.created_at limit 1;
  end if;
  return new;
end;
$$;

-- Transactions and rules: the wallet of their category.
create function public.fill_wallet_from_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.wallet_id is null then
    select c.wallet_id into new.wallet_id from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id;
  end if;
  return new;
end;
$$;

-- Deposits: the wallet of their goal.
create function public.fill_wallet_from_goal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.wallet_id is null then
    select g.wallet_id into new.wallet_id from public.goals g
    where g.id = new.goal_id and g.user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger categories_fill_wallet before insert on public.categories
for each row execute function public.fill_wallet_from_first();
create trigger goals_fill_wallet before insert on public.goals
for each row execute function public.fill_wallet_from_first();
create trigger transactions_fill_wallet before insert on public.transactions
for each row execute function public.fill_wallet_from_category();
create trigger recurring_rules_fill_wallet before insert on public.recurring_rules
for each row execute function public.fill_wallet_from_category();
create trigger goal_deposits_fill_wallet before insert on public.goal_deposits
for each row execute function public.fill_wallet_from_goal();

-- A row never moves to another wallet.
create function public.keep_wallet()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.wallet_id is distinct from old.wallet_id then
    raise exception 'wallet_id cannot change' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger categories_keep_wallet before update on public.categories
for each row execute function public.keep_wallet();
create trigger recurring_rules_keep_wallet before update on public.recurring_rules
for each row execute function public.keep_wallet();
create trigger transactions_keep_wallet before update on public.transactions
for each row execute function public.keep_wallet();
create trigger goals_keep_wallet before update on public.goals
for each row execute function public.keep_wallet();
create trigger goal_deposits_keep_wallet before update on public.goal_deposits
for each row execute function public.keep_wallet();

-- ---------------------------------------------------------------------------
-- Row Level Security on wallets
-- ---------------------------------------------------------------------------

alter table public.wallets enable row level security;

create policy "wallets: read own with access" on public.wallets for select to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()));

create policy "wallets: edit own with access" on public.wallets for update to authenticated
using (user_id = (select auth.uid()) and (select public.has_access()))
with check (user_id = (select auth.uid()) and (select public.has_access()));

-- Create and delete only through create_wallet / delete_wallet (limit and last-wallet
-- rule). A client may edit only these columns.
revoke all on public.wallets from anon, authenticated;
grant select on public.wallets to authenticated;
grant update (name, color, icon, sort_order, month_start_day, overall_budget) on public.wallets to authenticated;

-- ---------------------------------------------------------------------------
-- Defaults
-- ---------------------------------------------------------------------------

create function public.seed_wallet_categories(p_user_id uuid, p_wallet_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, wallet_id, type, default_key, icon, color, sort_order) values
    (p_user_id, p_wallet_id, 'expense', 'car',      'car',                   '#5B9BD5', 1),
    (p_user_id, p_wallet_id, 'expense', 'food',     'silverware-fork-knife', '#E8A87C', 2),
    (p_user_id, p_wallet_id, 'expense', 'leisure',  'gift',                  '#E07A8B', 3),
    (p_user_id, p_wallet_id, 'expense', 'housing',  'home',                  '#9B8AD6', 4),
    (p_user_id, p_wallet_id, 'expense', 'health',   'heart-pulse',           '#6FB7B0', 5),
    (p_user_id, p_wallet_id, 'expense', 'shopping', 'shopping',              '#F2C94C', 6),
    (p_user_id, p_wallet_id, 'expense', 'bills',    'receipt',               '#B58A5A', 7),
    (p_user_id, p_wallet_id, 'expense', 'other',    'dots-horizontal',       '#8A9099', 8),
    (p_user_id, p_wallet_id, 'income',  'salary',   'cash-multiple',         '#4A7C6F', 1),
    (p_user_id, p_wallet_id, 'income',  'other',    'plus-circle',           '#8FBF6B', 2);
$$;

-- New accounts: settings, a first wallet and its default categories.
create or replace function public.seed_user_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet uuid;
begin
  insert into public.user_settings (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  v_wallet := public.first_wallet_of(p_user_id);
  if v_wallet is null then
    insert into public.wallets (user_id, default_key, sort_order)
    values (p_user_id, 'personal', 0)
    returning id into v_wallet;
  end if;

  if not exists (select 1 from public.categories where wallet_id = v_wallet) then
    perform public.seed_wallet_categories(p_user_id, v_wallet);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Create and delete
-- ---------------------------------------------------------------------------

create function public.create_wallet(p_name text, p_color text, p_icon text)
returns public.wallets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_wallet public.wallets;
begin
  if v_user is null or not public.has_access() then
    raise exception 'no access' using errcode = '42501';
  end if;
  insert into public.wallets (user_id, name, color, icon, sort_order)
  values (
    v_user,
    trim(p_name),
    p_color,
    coalesce(nullif(trim(p_icon), ''), 'wallet-outline'),
    coalesce((select max(sort_order) + 1 from public.wallets where user_id = v_user), 0)
  )
  returning * into v_wallet;
  perform public.seed_wallet_categories(v_user, v_wallet.id);
  return v_wallet;
end;
$$;

-- Deletes a wallet and everything in it. The last wallet stays.
create function public.delete_wallet(p_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.has_access() then
    raise exception 'no access' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('wallets:' || v_user::text, 0));
  if not exists (select 1 from public.wallets where id = p_wallet_id and user_id = v_user) then
    raise exception 'wallet not found' using errcode = 'P0002';
  end if;
  if (select count(*) from public.wallets where user_id = v_user) <= 1 then
    raise exception 'last_wallet' using errcode = 'P0001', hint = 'Every account keeps at least one wallet.';
  end if;
  delete from public.wallets where id = p_wallet_id and user_id = v_user;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reads per wallet
-- ---------------------------------------------------------------------------

-- Sum per category for a date range in one wallet. Runs as the caller, so RLS applies.
-- The old two-argument version stays for older app builds.
create function public.category_totals(p_wallet_id uuid, p_from date, p_to date)
returns table (category_id uuid, type public.transaction_type, total bigint, count bigint)
language sql
stable
set search_path = ''
as $$
  select t.category_id, t.type, sum(t.amount)::bigint, count(*)
  from public.transactions t
  where t.user_id = (select auth.uid()) and t.wallet_id = p_wallet_id and t.date between p_from and p_to
  group by t.category_id, t.type;
$$;

revoke execute on function public.enforce_wallet_limit() from public, anon, authenticated;
revoke execute on function public.first_wallet_of(uuid) from public, anon, authenticated;
revoke execute on function public.fill_wallet_from_first() from public, anon, authenticated;
revoke execute on function public.fill_wallet_from_category() from public, anon, authenticated;
revoke execute on function public.fill_wallet_from_goal() from public, anon, authenticated;
revoke execute on function public.keep_wallet() from public, anon, authenticated;
revoke execute on function public.seed_wallet_categories(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_wallet(text, text, text) from public, anon;
revoke execute on function public.delete_wallet(uuid) from public, anon;
revoke execute on function public.category_totals(uuid, date, date) from public, anon;

grant execute on function public.create_wallet(text, text, text) to authenticated;
grant execute on function public.delete_wallet(uuid) to authenticated;
grant execute on function public.category_totals(uuid, date, date) to authenticated;
