-- supabase/migrations/20260912010000_market_categories_and_players.sql
-- Purpose: five markets instead of one, free player accounts with their own picks, and
--   weekly competitions (Roy, 12 Sep 2026).
-- Date: 2026-09-12
--
-- Markets: penny, dow, nasdaq, sp500, crypto. Every model picks once per market per day,
-- from the same research pack for that market.
--
-- Player picks mirror the Gridiron rules that already work: a player may change a pick
-- until that day's lock (09:30 ET, market open), never after; other players' picks stay
-- hidden until the lock so nobody can copy. Both rules are enforced by triggers, not
-- only by the API.
--
-- CR AudioViz AI, LLC · EIN 39-3646201

create table if not exists public.market_categories (
  id           text primary key,
  label        text not null,
  description  text not null,
  sort_order   integer not null,
  active       boolean not null default true
);
insert into public.market_categories (id, label, description, sort_order) values
  ('sp500',  'S&P 500',      'Large US companies across every sector.',            1),
  ('nasdaq', 'Nasdaq 100',   'Technology-heavy Nasdaq names.',                     2),
  ('dow',    'Dow 30',       'The thirty Dow Jones Industrial Average companies.', 3),
  ('penny',  'Penny stocks', 'Lower-priced, higher-volatility US listings.',       4),
  ('crypto', 'Crypto',       'Major cryptocurrencies, priced around the clock.',   5)
on conflict (id) do update set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

-- Trading days: one row per market day, carrying that day's lock.
create table if not exists public.market_days (
  pick_date     date primary key,
  lock_at       timestamptz not null,
  week_start    date not null,
  status        text not null default 'open' check (status in ('open', 'locked', 'settled')),
  created_at    timestamptz not null default now()
);
alter table public.market_days enable row level security;
revoke all on public.market_days from anon, authenticated;
drop policy if exists public_read_market_days on public.market_days;
create policy public_read_market_days on public.market_days for select to anon, authenticated using (true);

create table if not exists public.market_players (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  handle       text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.market_players enable row level security;
revoke all on public.market_players from anon, authenticated;

create table if not exists public.market_player_picks (
  user_id     uuid not null references public.market_players (user_id) on delete cascade,
  pick_date   date not null references public.market_days (pick_date),
  category    text not null references public.market_categories (id),
  symbol      text not null,
  entry_price numeric(18,6),
  current_price numeric(18,6),
  return_percent numeric(10,4),
  result      text check (result in ('win', 'loss', 'flat')),
  status      text not null default 'active' check (status in ('active', 'closed')),
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, pick_date, category)
);
alter table public.market_player_picks enable row level security;
revoke all on public.market_player_picks from anon, authenticated;
create index if not exists market_player_picks_date_idx on public.market_player_picks (pick_date, category);

-- A player's pick is editable until that day's lock, and frozen afterwards.
create or replace function public.market_player_pick_guard()
returns trigger language plpgsql as $fn$
declare lock_at timestamptz;
begin
  select d.lock_at into lock_at from public.market_days d
    where d.pick_date = case when tg_op = 'DELETE' then old.pick_date else new.pick_date end;
  if tg_op = 'DELETE' then
    if current_user in ('authenticated', 'anon') and (lock_at is null or now() >= lock_at) then
      raise exception 'Picks are locked';
    end if;
    return old;
  end if;
  -- Settlement (service role) writes prices and results after the lock; a PLAYER may not.
  if current_user in ('authenticated', 'anon') then
    if lock_at is null or now() >= lock_at then
      raise exception 'Picks are locked';
    end if;
    if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id or new.pick_date is distinct from old.pick_date or new.category is distinct from old.category) then
      raise exception 'Pick identity cannot change';
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists market_player_pick_guard on public.market_player_picks;
create trigger market_player_pick_guard before insert or update or delete on public.market_player_picks
  for each row execute function public.market_player_pick_guard();

-- Weekly competitions: Monday-to-Sunday, scored on closed picks in that week.
create table if not exists public.market_weeks (
  week_start  date primary key,
  week_end    date not null,
  label       text not null,
  status      text not null default 'open' check (status in ('open', 'settled')),
  created_at  timestamptz not null default now()
);
alter table public.market_weeks enable row level security;
revoke all on public.market_weeks from anon, authenticated;
drop policy if exists public_read_market_weeks on public.market_weeks;
create policy public_read_market_weeks on public.market_weeks for select to anon, authenticated using (true);

alter table public.stock_picks add column if not exists market_category text references public.market_categories (id);
update public.stock_picks set market_category = 'sp500' where market_category is null and javari_request_id is not null;
create index if not exists stock_picks_category_date_idx on public.stock_picks (market_category, pick_date);
