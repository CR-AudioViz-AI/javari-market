-- supabase/migrations/20260912020000_market_benchmarks.sql
-- Purpose: score every pick against its market's benchmark, so "won" means "beat the
--   index", not "went up in a rising market".
-- Date: 2026-09-12
-- CR AudioViz AI, LLC · EIN 39-3646201

alter table public.stock_picks add column if not exists benchmark_symbol  text;
alter table public.stock_picks add column if not exists benchmark_entry   numeric(18,6);
alter table public.stock_picks add column if not exists benchmark_current numeric(18,6);
alter table public.stock_picks add column if not exists benchmark_return  numeric(10,4);
alter table public.stock_picks add column if not exists alpha             numeric(10,4);

alter table public.market_player_picks add column if not exists benchmark_return numeric(10,4);
alter table public.market_player_picks add column if not exists alpha            numeric(10,4);

-- Benchmark prices on the day a pick is made, shared by every pick in that market.
create table if not exists public.market_benchmark_prices (
  pick_date date not null,
  symbol    text not null,
  price     numeric(18,6) not null,
  primary key (pick_date, symbol)
);
alter table public.market_benchmark_prices enable row level security;
revoke all on public.market_benchmark_prices from anon, authenticated;
