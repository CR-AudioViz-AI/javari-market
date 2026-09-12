-- supabase/migrations/20260912040000_market_universe.sql
-- Purpose: the real investable universe for each market, refreshed daily, so a model or
--   a player can research and choose ANY constituent rather than a list I wrote by hand.
-- Date: 2026-09-12
--
-- Until now each market was a pool of 10-22 symbols chosen by me. That put my stock
-- selection inside every result: a model could not find an opportunity I had not handed
-- it. The universes are now: the full S&P 500, the full Nasdaq-100, the Dow 30, every US
-- listing that meets a published penny rule, and the top 100 coins by market cap.
--
-- A snapshot is stored per day, so a pick can always be validated and priced against the
-- universe that existed when it was made.
--
-- CR AudioViz AI, LLC · EIN 39-3646201

create table if not exists public.market_universe (
  snapshot_date date not null,
  category      text not null references public.market_categories (id),
  symbol        text not null,
  name          text,
  price         numeric(18,6),
  volume        bigint,
  market_cap    numeric(20,2),
  sector        text,
  updated_at    timestamptz not null default now(),
  primary key (snapshot_date, category, symbol)
);
create index if not exists market_universe_lookup on public.market_universe (category, snapshot_date);
alter table public.market_universe enable row level security;
revoke all on public.market_universe from anon, authenticated;
drop policy if exists public_read_universe on public.market_universe;
create policy public_read_universe on public.market_universe for select to anon, authenticated using (true);

-- The penny rule, published so it is a rule and not a preference.
insert into public.market_categories (id, label, description, sort_order) values
  ('penny', 'Penny stocks', 'US listings under $5 with at least 300,000 average daily volume and a market value above $50M. The liquidity floor keeps out names where a quoted price is not a real price.', 4)
on conflict (id) do update set description = excluded.description;
